import React, { useState, useCallback } from 'react';
import {Button, Row, Container, Col} from 'react-bootstrap';
import {BrowserRouter as Router, Link } from "react-router-dom";

const Welcome = () => {
  const setCandidate = event => {
    localStorage.setItem('candidate', 1);
  };
  const setInterviewer = event => {
    localStorage.setItem('candidate', 0)
  };
  return (
    <div className = "pb-2">
        <Row style = {{height: "80vh"}}>
          <Col className = "horizontal-center my-auto">
            <h1>Are you a &nbsp;
              <Link to={{
                pathname: '/candidate'
              }}>
                <>
                  <style type="text/css">
                  {`
                    .btn-flat {
                      background-color: #007bff;
                      color: white;
                    }

                    .btn-xxl {
                      padding: 1rem 1.5rem;
                      font-size: 1.7rem;
                      font-weight: bold;
                    }
                    `}
                  </style>

                  <Button variant="flat" size="xxl" onClick = {setCandidate}>
                    candidate
                  </Button>
                </>
              </Link>

              &nbsp; or an &nbsp;

              <Link to={{
                pathname: '/login'
              }}>
                <>
                  <style type="text/css">
                  {`
                    .btn-flat {
                      background-color: #007bff;
                      color: white;
                    }

                    .btn-xxl {
                      padding: 1rem 1.5rem;
                      font-size: 1.7rem;
                      font-weight: bold;
                    }
                    `}
                  </style>

                  <Button variant="flat" size="xxl" onClick = {setInterviewer}>
                    interviewer
                  </Button>
                </>
              </Link>
              &nbsp;?
            </h1>
          </Col>
        </Row>

    </div>
  );
}

export default Welcome;