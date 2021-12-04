import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Loading } from 'react-simple-chatbot';

import { LexRuntimeV2Client, RecognizeTextCommand } from "@aws-sdk/client-lex-runtime-v2";
import Speech from 'speak-tts'

// import env from '../config'
require('dotenv').config()

const speech = new Speech()

speech.init({
    'volume': 1,
     'lang': 'en-GB',
     'rate': 1,
     'pitch': 1,
     'voice':'Google UK English Male',
     'splitSentences': true,
     'listeners': {
         'onvoiceschanged': (voices) => {
             console.log("Event voiceschanged", voices)
         }
     }
})

class DoctorAI extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      result: ''
    };

    this.triggetNext = this.triggetNext.bind(this);
  }

  callDoctorAI() {

    console.log(process.env)

    const self = this;
    const { steps } = this.props;
    const search = steps.user.value;

    const lexParams = {
      credentials: {accessKeyId: process.env.LEX_ACCESS_KEY, secretAccessKey: process.env.LEX_SECRET},
      userId: process.env.LEX_USERID, 
      region: process.env.LEX_REGION
    };

    const input = {
        botAliasId: process.env.LEX_botAliasId,
        botId: process.env.LEX_botId,
        localeId: process.env.LEX_localeId,
        sessionId: process.env.LEX_sessionId,
        requestContentType: 'text/plain; charset=utf-8',
        text: search
    }

    const client = new LexRuntimeV2Client(lexParams);
    const command = new RecognizeTextCommand(input);
    console.log(command);

    async function callAsync() {
      let textToSpeak = ''
      try {
        const response = await client.send(command);
        textToSpeak = response.messages[0].content;
        console.log('Doctor AI:' + textToSpeak);
      }
      catch (error) {
        console.error(error)
        console.log('Doctor AI:' + textToSpeak);
        textToSpeak = "Sorry I can't answer that. Could you please try again?"
      }

      self.setState({ loading: false, result: textToSpeak });
      speech.speak({ text: textToSpeak })
        .then(() => { console.log("Success !") })
        .catch(e => { console.error("An error occurred :", e) })
    }
    callAsync();
  }
  
  triggetNext() {
    this.setState({}, () => {
      this.props.triggerNextStep();
    });
  }

  componentDidMount() {
    this.callDoctorAI();
    this.triggetNext();
  }

  render() {
    const { loading, result } = this.state;

    return (
      <div className="bot-response">
        { loading ? <Loading /> : result }
      </div>
    );
  }
}

DoctorAI.propTypes = {
  steps: PropTypes.object,
  triggerNextStep: PropTypes.func,
};

DoctorAI.defaultProps = {
  steps: undefined,
  triggerNextStep: undefined,
};

export default DoctorAI;