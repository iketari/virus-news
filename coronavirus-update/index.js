// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
const parse = require('csv-parse');
const fs = require('fs');
const util = require('util');
const fetch = require('node-fetch');

const log = (...args) => {
  console.log(...args.map(arg => typeof arg === 'object' ? util.inspect(obj, {showHidden: false, depth: null}) : arg));
};

// Set the region 
AWS.config.update({region: 'eu-west-1'});

const TABLE = 'coronavirus-data-ts';

function getRemoteDataSrc(type) {
  return `https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-${type}.csv`;
}

async function getRemoteData(url) {
  try {
    const response = await fetch(url);
    const body = await response.text();
    return body;
  } catch (error) {
    console.log(error);
  }
}

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

function getCSVData(file) {
  return fs.readFileSync(file);
}

async function getParsedData(csvData) {
  return new Promise((resolve, reject) => {
      parse(csvData, {
        columns: true,
        skip_empty_lines: true
      }, (err, output) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(output);
      });
  });
}

/**
 * Returns total numbers by date
 * @returns {Object.<string, number>}
 */
function getTotalNumbers(locations) {
  const metaFields = ['Province/State', 'Country/Region', 'First confirmed date in country', 'Lat', 'Long'];
  return locations.reduce((acc, curr) => {
    Object.keys(curr).forEach(key => {
      if (metaFields.includes(key)) return;

      let ts = Date.parse(key);
      if (isNaN(ts)) return;
      let tsKey = ts.toString();
      let currValue = parseInt(curr[key], 10);

      if (acc[tsKey] == null) {
        acc[tsKey] = !isNaN(currValue) ? currValue : 0;
        return;
      }

      acc[tsKey] =  acc[tsKey] != null && !isNaN(currValue) ? (acc[tsKey] + currValue) : acc[tsKey];
    });

    return acc;
  }, {});
}


async function processData(type, data){
  const csvData = await getRemoteData(getRemoteDataSrc(type));
  const parsedData = await getParsedData(csvData);
  const totalNumbers = getTotalNumbers(parsedData);
  
  log(`Data retrived for ${type}`);

  Object.entries(totalNumbers).forEach(([ts, value]) => {
    data[ts] = {
      ...(data[ts] || {}),
      [type]: value
    };
  });

  return data;
}

function cleanUp(data) {
  const fields = ['Confirmed', 'Recovered', 'Deaths'];

  for (let itemKey in data) {
    const itemData = data[itemKey];
    if (fields.every(fieldName => fieldName in itemData)) continue;

    delete data[itemKey];
  }
}

async function upload(preparedData) {
  const params = {
    RequestItems: {}
  };
  
  params.RequestItems[TABLE] = Object.entries(preparedData).map(([key, data]) => {
      return {
          PutRequest: {
              Item: {
                  'date': {N: '' + key},
                  'Confirmed': {N: '' + data['Confirmed']},
                  'Recovered': {N: '' + data['Recovered']},
                  'Death': {N: '' + data['Deaths']},
                  'LastModified': {N: '' + Date.now()},
              }
          }
      };
  })
  .sort((a,b) => {
    return b.PutRequest.Item.date.N - a.PutRequest.Item.date.N; // most fresh data
  })
  .slice(0, 25); // AWS limits it!

  // log(params.RequestItems[TABLE]);
  
  return new Promise((resolve, reject) => {
      // Call DynamoDB to add the item to the table
      ddb.batchWriteItem(params, function(err, data) {
        const date = new Date(+params.RequestItems[TABLE][0].PutRequest.Item.LastModified.N).toUTCString();
        if (err) {
          log('Error', err);
          reject(err);
        } else {
            resolve(data);
            log(`Success, Last update at ${date}`);
        }
      });  
  });
  

}

const main = async (event) => {
    const response = {
        statusCode: 200,
        body: '',
    };

    try {
        let data = await processData('Confirmed', {});
        await processData('Recovered', data);
        await processData('Deaths', data);
        
        cleanUp(data);
        await upload(data);
    } catch(e) {
        response.statusCode = 500;
        response.body = e;
        return response;
    }

    return response;
};
// main();
exports.handler = main;
