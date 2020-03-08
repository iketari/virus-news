/*
 * Copyright 2018-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

const {languageStrings} = require('./locales');

const TABLE = 'coronavirus-data-ts';
const TABLE_COUNTRIES = 'coronavirus-countries'

// sets up dependencies
const Alexa = require('ask-sdk-core');
const i18n = require('i18next');

// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'eu-west-1'});

const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

function getTodayTs() {
  const d = new Date();
  d.setHours(0,0,0,0);

  return +d;
}

const getLatestStat = async function() {
  const params = {
    TableName: TABLE,
  };
  return new Promise((resolve, reject) => {
    ddb.scan(params, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data.Items);
      }
    });
  })
}

const getLatestForCountry = async country => {
  const params = {
    TableName: TABLE_COUNTRIES,
    KeyConditionExpression: "#c = :country and #d = :today",
    ExpressionAttributeNames:{
        "#c": "Country",
        "#d": "Date"
    },
    ExpressionAttributeValues: {
        ":country": {S: country},
        ":today": {N: getTodayTs().toString()}
    }
  };
  return new Promise((resolve, reject) => {
    ddb.query(params, function(err, data) {
      if (err) {
        console.log('ddb.query error!', err);
        reject(err);
      } else {
        resolve(data.Items);
      }
    });
  })
}

// core functionality for fact skill
const GetNewFactHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    // checks request type
    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'GetNewFactIntent');
  },
  async handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    // const randomFact = requestAttributes.t('FACTS');
    // concatenates a standard message with the random fact
    // const speakOutput = requestAttributes.t('GET_FACT_MESSAGE') + randomFact;

    let items, country;

    console.log(request);
    if (request.intent && request.intent.slots && request.intent.slots.country && request.intent.slots.country.value) {
      country = request.intent.slots.country.value;

      try {
        console.log(`Querying country ${country}`);
        items = await getLatestForCountry(country);
      } catch(e) {
        console.log(e);
        items = await getLatestStat();
        items.sort((item1, item2) => {
          return item2['date'].N - +item1['date'].N;
        });
      }

    } else {
      items = await getLatestStat();
      items.sort((item1, item2) => {
        return item2['date'].N - +item1['date'].N;
      });
    }
    
    const item = items.shift(); // get latest
    console.log(item);
    const confirmed = item['Confirmed'].N;
    const recovered = item['Recovered'].N;
    const death = item['Death'].N;
    const date = new Date(+item['LastModified'].N);
   
    return handlerInput.responseBuilder
      .speak(`<speak>
        Latest Coronavirus data${country ? (' for ' + country) : ''}. ${confirmed} confirmed cases.
        <amazon:emotion name="excited" intensity="medium">
             ${recovered} people recovered.
        </amazon:emotion>
        <amazon:emotion name="disappointed" intensity="high">
             ${death} lethal cases.
        </amazon:emotion>
        Updated at ${date.toUTCString()}.
      </speak>`)
      // Uncomment the next line if you want to keep the session open so you can
      // ask for another fact without first re-opening the skill
      // .reprompt(requestAttributes.t('HELP_REPROMPT'))
      .withSimpleCard('Wuhan virus data', `Confirmed: ${confirmed}. Recovered: ${recovered}. Death: ${death}. Updated at: ${date.toUTCString()}`)
      .getResponse();
  },
};

const GetNewAdviceHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
        && request.intent.name === 'GetNewAdviceIntent';
  },
  async handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const randomAdvice = requestAttributes.t('PROTECTION_ADVICE');
    const reprompt = requestAttributes.t('ADVICE_REPROMPT');

    return handlerInput.responseBuilder
      .speak(randomAdvice)
      .reprompt(reprompt)
      .withSimpleCard('Wuhan virus advice', randomAdvice)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('HELP_MESSAGE'))
      .reprompt(requestAttributes.t('HELP_REPROMPT'))
      .getResponse();
  },
};

const FallbackHandler = {
  // The FallbackIntent can only be sent in those locales which support it,
  // so this handler will always be skipped in locales where it is not supported.
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('FALLBACK_MESSAGE'))
      .reprompt(requestAttributes.t('FALLBACK_REPROMPT'))
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('STOP_MESSAGE'))
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('ERROR_MESSAGE'))
      .reprompt(requestAttributes.t('ERROR_MESSAGE'))
      .getResponse();
  },
};

const LocalizationInterceptor = {
  process(handlerInput) {
    // Gets the locale from the request and initializes i18next.
    const localizationClient = i18n.init({
      lng: handlerInput.requestEnvelope.request.locale,
      resources: languageStrings,
      returnObjects: true
    });
    // Creates a localize function to support arguments.
    localizationClient.localize = function localize() {
      // gets arguments through and passes them to
      // i18next using sprintf to replace string placeholders
      // with arguments.
      const args = arguments;
      const value = i18n.t(...args);
      // If an array is used then a random value is selected
      if (Array.isArray(value)) {
        return value[Math.floor(Math.random() * value.length)];
      }
      return value;
    };
    // this gets the request attributes and save the localize function inside
    // it to be used in a handler by calling requestAttributes.t(STRING_ID, [args...])
    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function translate(...args) {
      return localizationClient.localize(...args);
    }
  }
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    GetNewFactHandler,
    GetNewAdviceHandler,
    HelpHandler,
    ExitHandler,
    FallbackHandler,
    SessionEndedRequestHandler,
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addErrorHandlers(ErrorHandler)
  .withCustomUserAgent('sample/basic-fact/v2')
  .lambda();


