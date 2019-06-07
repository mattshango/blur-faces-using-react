import React,  { Component } from 'react';
import Facesoft from 'facesoft';
import { Container, Row, Col, Button, Input, Label } from 'reactstrap';
import InputRange from 'react-input-range';
import BlurFaces from './blurFaces';
import 'react-input-range/lib/css/index.css';
import './App.css';

export default class App extends Component {
  constructor(props) {
    super(props);
 
    this.state = {
      threshold: 9,
      image: {},
      data: [],
      smooth: true,
    }

    this.facesoft = new Facesoft(process.env.REACT_APP_FACESOFT_API_KEY);

    this.handleChange = this.handleChange.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }
  

  handleChange(event) {
    if(event.target.files.length < 1) return

    const scope = this;
    const uri = URL.createObjectURL(event.target.files[0]);
    const img = new Image();
    img.src = uri;
    img.onload = () => {
      scope.setState({ 
        image: { 
          uri, 
          width: img.width,
          height: img.height
        } 
      })
    }
  }

  handleClick(event) {
    this.facesoft.detectFromURL(this.state.image.uri)
      .then(result => this.setState({data: result}))
      .catch(error => console.log(error))
  }
  

  render() {
    const { image, threshold, data, smooth } = this.state
    return (
      <div className="App">
      <header className="App-header">
        <h1>Blur Faces In Photos Using React.js</h1>
      </header>
      
      <Container>
        <Row className="justify-content-md-center">
          <Col md="1">
            <strong>Smooth</strong>
          </Col>
          <Col md="3">
            <Label>
              <Input 
                type="checkbox" 
                id="cb-4"
                checked={smooth}
                onChange={e => this.setState({ smooth: e.target.checked })}  
              />
              (Will be pixelated if unchecked)
            </Label>
          </Col>
          <Col md="1">
            <strong>Threshold</strong>
          </Col>
          <Col md="7">
            <InputRange
              step={0.25}
              maxValue={10}
              minValue={0}
              value={threshold}
              onChange={threshold => this.setState({ threshold })} 
            />
          </Col>
          <Col md="12" style={{paddingTop: 20}}>
            <hr></hr>
          </Col>
        </Row>
        <Row>
          <Col md="6">
            <div className="uploaded-image">
              <input 
                type="file" 
                onChange={this.handleChange}
                accept="image/x-png,image/gif,image/jpeg"
              />
              {
                image.hasOwnProperty("uri") && 
                <img 
                  src={image.uri} 
                  alt="upload" 
                  style={{maxWidth: "100%", margin: "10px 0px"}}
                />
              }
            </div>
            {
              image.hasOwnProperty("uri") && 
                <Button onClick={this.handleClick} outline color="primary" size="lg">Blur Faces</Button>
            }
          </Col>
          <Col md="6">
            <BlurFaces 
              image={image} 
              threshold={threshold} 
              data={data} 
              smooth={smooth}
            />
          </Col>
        </Row>
      </Container>
    </div>
    )
  }
}