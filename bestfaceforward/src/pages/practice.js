import React, { Component } from 'react'
import {Form, Button, Col, Row} from 'react-bootstrap'
import Webcam from "react-webcam";
import Speech from 'speak-tts'
import questions from '../questions.json'
import { ReactMediaRecorder } from "react-media-recorder";

import "../css/about.css";

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
        this.state = {
            question: "",
            inds:[],
            videos:[],
            recording: false
        }
      }
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
            console.log("There are no questions left.")
            
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
                    console.log(this.state.inds)
                    console.log(rand)
                        speech.speak({
                            text: this.state.question,
                        })
                })
            } else {
                this.setState({
                    question:"",
                    inds: this.state.inds.concat([rand])
                }, () => {
                    console.log(this.state.inds)
                    console.log(rand)
                })
            }
        }
        
    }

    generateReport(){
        if(this.state.videos.length>3){
            this.state.videos.shift()
        }
        return(
            <div>
                {this.state.videos.map((url, index) => (
                    <video key={index} src={url} controls/>
                ))}
            </div>
        )
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
                <div className="homeBox">
                <div className="homeHead">Interview Practice Report</div>
                {this.generateReport()}
            </div>
                
            )
            
        } else {
            return (
                <ReactMediaRecorder
                video
                render={({ status, startRecording, stopRecording, mediaBlobUrl }) => (
                    <div>
                    <div className="homeBox">
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
                        this.setState({
                            recording: true
                        })
                    } else {
                        stopRecording()
                        setTimeout(()=>{
                            this.setState({
                                videos: this.state.videos.concat([mediaBlobUrl])
                            }, () => {
                                console.log(this.state.videos)
                                startRecording()
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