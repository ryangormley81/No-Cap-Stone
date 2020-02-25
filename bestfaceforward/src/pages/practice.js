import React, { Component } from 'react'
import {Button} from 'react-bootstrap'
import Webcam from "react-webcam";
import Speech from 'speak-tts'
import questions from '../questions.json'
import { ReactMediaRecorder } from "react-media-recorder";
import recognizeMicrophone from 'watson-speech/speech-to-text/recognize-microphone';
import {BrowserRouter as Redirect  } from "react-router-dom";

import "../css/practice.css";
import axios from 'axios'

const videoConstraints = {
    width: 1920,
    height: 1080,
    facingMode: "user"
  };

const speech = new Speech()
speech.init({
    voice:'Google UK English Female',
    }).then((data) => {
    // The "data" object contains the list of available voices and the voice synthesis params
    console.log("Speech is ready, voices are available", data)
}).catch(e => {
    console.error("An error occured while initializing : ", e)
})



export default class Practice extends Component {
    constructor(props){
        super(props)
        // axios.post('http://localhost:3001/db/resetPractice')
        this.state = {
            question: "",
            inds:[],
            videos:[],
            recording: false,
            transcripts:[],
            text: "",
            token: null,
            listening: false,
            error: null,
            serviceUrl: null,
            formattedMessages: [],
            r:255,
            g:204,
            b:102,
            status: "neutral",
            videoScores:[]
        }
        this.handleFormattedMessage = this.handleFormattedMessage.bind(this);
        this.getFinalResults = this.getFinalResults.bind(this);
        this.getCurrentInterimResult = this.getCurrentInterimResult.bind(this);
        this.getFinalAndLatestInterimResult = this.getFinalAndLatestInterimResult.bind(this);
      }
      //speech stuff
      componentDidMount(){
        this.fetchToken()
      }

      fetchToken() {
        return fetch('/api/v1/credentials').then((res) => {
          if (res.status !== 200) {
            throw new Error('Error retrieving auth token');
          }
          return res.text();
        }).then((token) => {
          var jsonToken = JSON.parse(token)
          this.setState({token: jsonToken.accessToken, serviceUrl: jsonToken.serviceUrl})
        }).catch(this.handleError);
      }

      handleError = (err, extra) => {
        console.error(err, extra);
        if (err.name === 'UNRECOGNIZED_FORMAT') {
          err = 'Unable to determine content type from file name or header; mp3, wav, flac, ogg, opus, and webm are supported. Please choose a different file.';
        } else if (err.name === 'NotSupportedError' && this.state.audioSource === 'mic') {
          err = 'This browser does not support microphone input.';
        } else if (err.message === '(\'UpsamplingNotAllowed\', 8000, 16000)') {
          err = 'Please select a narrowband voice model to transcribe 8KHz audio files.';
        } else if (err.message === 'Invalid constraint') {
          // iPod Touch does this on iOS 11 - there is a microphone, but Safari claims there isn't
          err = 'Unable to access microphone';
        }
        this.setState({ error: err.message || err });
      }

      stopListening = () => {
       if (this.stream) {
         this.stream.stop();
       }

       this.setState({
           text: "",
           listening: false,
           formattedMessages: []
        });
      }


      handleFormattedMessage(msg) {

        const { formattedMessages } = this.state;
        this.setState({ formattedMessages: formattedMessages.concat(msg) });
      }

      getFinalResults() {
       return this.state.formattedMessages.filter(r => r.results
         && r.results.length && r.results[0].final);
      }

      getCurrentInterimResult() {

        if (this.state.formattedmessages != []){
          const r = this.state.formattedMessages[this.state.formattedMessages.length - 1];
          if (!r || !r.results || !r.results.length || r.results[0].final) {
            return null;
          }
          return r;
        }


      }

      getFinalAndLatestInterimResult() {
        const final = this.getFinalResults();
        const interim = this.getCurrentInterimResult();
        if (interim) {
          final.push(interim);
        }
        return final;
      }

      onClickListener = () => {
        if (this.state.listening) {
          this.stopListening();
          return;
        }

        this.setState({ listening: !this.state.listening });

        const stream = recognizeMicrophone({
          accessToken: this.state.token,
          smart_formatting: true,
          format: true, // adds capitals, periods, and a few other things (client-side)
          objectMode: true,
          interim_results: false,
          url: this.state.serviceUrl
        });

        this.stream = stream;


        stream.on('data', this.handleFormattedMessage);

        stream.recognizeStream.on('end', () => {
          if (this.state.error) {
          }
        });


        stream.on('error', (data) => this.stopListening());
      }
      //practice stuff
    randomQuestion(){
        const min = 1;
        const max = 33;
        let rand = min + Math.random() * (max - min);
        if(this.state.inds.length===max){
            this.setState({
                question: "There are no questions left."
            }, () => {
                speech.speak({
                    text: "There are no questions left.",
                })
            })

        } else {
            while(this.state.inds.includes(Math.round(rand))){
                rand = min + Math.random() * (max - min);
            }
            rand=Math.round(rand)
            if(this.state.inds.length<3){
                this.setState({
                    question:questions[rand],
                    inds: this.state.inds.concat([rand])
                }, () => {
                    speech.speak({
                        text: this.state.question,
                    })
                })
            } else {
                this.setState({
                    question:"",
                    inds: this.state.inds.concat([rand])
                }, () => {
                })
            }
        }

    }
    async storeData(data){
      let response = axios.post('http://localhost:3001/db/writeTranscript', {username: "practice",transcript:data})
      console.log(response)
      response = axios.post('http://localhost:3001/db/writeVideos', {username: "practice",videos:this.state.videos})
      console.log(response)
      response = await axios.post('http://localhost:3001/db/readUserInfo', {username: "practice"})
      console.log(response)
    };
    decodeTranscript(transcript) {
      try {
        // When resultsBySpeaker is enabled, each msg.results array may contain multiple results.
        // The result_index is for the first result in the message,
        // so we need to count up from there to calculate the key.
        // let results = []
        // transcript.forEach((result)=>{
        //   results.push(result.results[0].alternatives[0]['transcript'])
        // })
    
        let results = ""
        transcript.forEach((result)=>{
          results=(result.results[0].alternatives[0]['transcript'])
        })
        if(results===""){
          results="No speech detected."
        }
        return (results);
      } catch (ex) {
        console.log(ex,transcript);
      }
    }
    generateReport(){
        if(this.state.videos.length>3){
            this.state.videos.shift()
        }
        if(this.state.transcripts.length>3){
            this.state.transcripts.pop()
        }
        console.log(this.state.videos)
        
        let transcriptText=[]
        this.state.transcripts.forEach(i =>{
          transcriptText.push(this.decodeTranscript(i))
        })
        console.log(transcriptText)
        this.storeData(transcriptText).then(()=>{
          console.log("stored")
          return(
            this.props.history.push({
              pathname: "/postAnalysis",
              state: { username: "practice", length:this.state.transcripts.length }
            })
          )
        })
        // <Redirect to={{
        //   pathname: '/postAnalysis',
        //   state: {id: props.id, name: props.name}
        // }}>
        // return(
        //     <div>
        //         {this.state.videos.map((url,index) => (
        //             <video key={'v'+index} src={url} controls/>
        //         ))}
        //         {this.state.transcripts.map((text,index) => (
        //             <div>{<Transcript key={'t'+index} messages={text}/>}</div>
        //         ))}
        //     </div>
        // )
    }

    render() {
        let buttonText="Next Question"
        if(this.state.inds.length===4){
            buttonText="Generate Report"
        } else if(this.state.inds.length===3){
            buttonText="End Questions"
        } else if(this.state.question===""){
            buttonText="Start Questions"
        }

        if(this.state.inds.length===5){
            
            return(
              <div>
              <div>{this.generateReport()}</div>
              </div>
            )

        } else {
          return (
              <ReactMediaRecorder
              video
              render={({ status, startRecording, stopRecording, mediaBlobUrl }) => (
                  <div>
                  <div className="homeBox-practice">
                      <h1>{status}</h1>
                      <Webcam
                      audio={false}
                      height={300}
                      screenshotFormat="image/jpeg"
                      width={500}
                      videoConstraints={videoConstraints}
                      />
                  <Button onClick={()=> {
                  if(this.state.recording===false){
                      startRecording()
                      this.onClickListener()
                      this.setState({
                          recording: true
                      })
                  } else {
                      stopRecording()
                      this.onClickListener()
                      setTimeout(()=>{
                          this.setState({
                              transcripts:this.state.transcripts.concat([this.getFinalAndLatestInterimResult()]),
                              videos: this.state.videos.concat([mediaBlobUrl])
                          }, () => {
                              console.log(this.state.videos)
                              startRecording()
                              this.onClickListener()
                          })
                      },500)

                  }
                  this.randomQuestion()
                  }}>{buttonText}</Button>
                  <div>{this.state.question}</div>
              </div>
              </div>
              )}
              />
          )
      }
  }
}