/**
 * @typedef {Object} CountryDTO
 * @property {number}   OBJECTID
 * @property {string}   Country_Region
 * @property {number}   Last_Update
 * @property {number}   Lat
 * @property {number}   Long_
 * @property {number}   Confirmed
 * @property {number}   Deaths
 * @property {number}   Recovered
 */

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

const TABLE = 'coronavirus-countries';

function getTodayTs() {
  const d = new Date();
  d.setHours(0,0,0,0);

  return +d;
}

function addZero(number) {
  return number < 10 ? '0' + number : number;
}

/**
 * @param {number} ts 
 * @returns {string} - MM-DD-YYYY
 */
function getDateString(ts) {
  const dateObj = new Date(ts);
  const month = dateObj.getUTCMonth() + 1; //months from 1-12
  const day = dateObj.getUTCDate();
  const year = dateObj.getUTCFullYear();

  return  `${addZero(month)}-${addZero(day)}-${year}`;
}

function getRemoteDataSrc() {
  return 'https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases/FeatureServer/2/query?f=json&where=Confirmed%20%3E%200&outFields=*&orderByFields=Confirmed%20desc';
}

async function getRemoteData(url) {
  try {
    const response = await fetch(url);
    const body = await response.json();
    return body;
  } catch (error) {
    console.log(error);
  }
}

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

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
function getTotalNumbers(apiData) {
  return apiData.features.reduce((acc, curr) => {
    acc.push(curr.attributes);
    return acc;
  }, []);
}


async function processData(){
  const json = await getRemoteData(getRemoteDataSrc());
  const totalNumbers = getTotalNumbers(json);

  return totalNumbers;
}


/**
 * @param {CountryDTO[]} preparedData 
 */
async function upload(preparedData) {
  const params = {
    RequestItems: {}
  };
  
  params.RequestItems[TABLE] = preparedData.map(entry => {
      return {
          PutRequest: {
              Item: {
                  'Country': {S: entry['Country_Region']},
                  'Date': {N: getTodayTs().toString()},
                  'Confirmed': {N: entry['Confirmed'].toString()},
                  'Recovered': {N: entry['Recovered'].toString()},
                  'Death': {N: entry['Deaths'].toString()},
                  'LastUpdate': {N: entry['Last_Update'].toString()},
              }
          }
      };
  });

  // console.log(params.RequestItems[TABLE]);
  
  return new Promise((resolve, reject) => {
      // Call DynamoDB to add the item to the table
      ddb.batchWriteItem(params, function(err, data) {
        const date = new Date().toUTCString();
        if (err) {
          console.log('Error', err);
          reject(err);
        } else {
            resolve(data);
            console.log(`Success, Last update at ${date}`);
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
      let data = await processData();

      while (data.length) {
        const batch = data.splice(0,25);
        await upload(batch);        
      }

    } catch(e) {
      response.statusCode = 500;
      response.body = e;
      return response;
    }

    return response;
};
main();
// exports.handler = main;
