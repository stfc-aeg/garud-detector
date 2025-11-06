import {React, useState} from "react";
import "bootstrap/dist/css/bootstrap.min.css";
//import "odin-react/dist/index.css";
import "./styles.css";
import Plot from "react-plotly.js";
import { TitleCard, EndpointInput, WithEndpoint, OdinGraph } from "odin-react";
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Stack from 'react-bootstrap/Stack';


function DisplayFrameStartInput(props) {
  function Send(event, endpoint) {
    endpoint
      .put(
        { ["display_start_frame"]: Number(event.target.value) },
        "application/bram/control"
      )
      .then((response) => {
        endpoint.mergeData(response, "application/bram/control");
      })
      .catch((err) => {
        console.error(err);
      });
  }
    function CheckInput(event, endpoint) {
      console.log(event);
      event.isTrusted && event.stopImmediatePropagation();
    }
  return (
    <>
      <div style={{ width: "100%" }}>
        <p style={{ width: "240px", display: "inline-block" }}>
          Starting frame (up to {props.periodicEndpoint.data.application.bram.control.max_frame}):
        </p>
        <input
          //onChange={(event) => console.log(event, props.periodicEndpoint)}
          //onInput={(event) => CheckInput(event, props.periodicEndpoint)}
          onSelect={(event) => Send(event, props.periodicEndpoint)}
          onBlur={(event) => Send(event, props.periodicEndpoint)}
          className="DisplayFrameStartInput"
          type="range"
          min="0"
          max={props.periodicEndpoint.data.application.bram.control.max_frame}
        />
        <p
          style={{ width: "30px", marginLeft: "10px", display: "inline-block" }}
        >
          {props.periodicEndpoint.data.application.bram.control.display_start_frame}
        </p>
      </div>
    </>
  );
}

function DisplayFrameNumInput(props) {
  function Send(event, endpoint) {
    endpoint
      .put(
        { ["display_num_frames"]: Number(event.target.value) },
        "application/bram/control"
      )
      .then((response) => {
        endpoint.mergeData(response, "application/bram/control");
      })
      .catch((err) => {
        console.error(err);
      });
  }
  return (
    <>
      <div style={{ width: "100%" }}>
        <p style={{ width: "240px", display: "inline-block" }}>
          Number of frames to display:
        </p>
        <input
          //onChange={(event) => Send(event, props.periodicEndpoint)}
          onSelect={(event) => Send(event, props.periodicEndpoint)}
          onBlur={(event) => Send(event, props.periodicEndpoint)}
          className="DisplayFrameNumInput"
          type="range"
          min="1"
          max={props.periodicEndpoint.data.application.bram.control.max_frame - props.periodicEndpoint.data.application.bram.control.display_start_frame}
        />
        <p
          style={{ width: "30px", marginLeft: "10px", display: "inline-block" }}
        >
          {props.periodicEndpoint.data.application.bram.control.display_num_frames}
        </p>
      </div>
    </>
  );
}

// a plotly component, to create a heatmap in black and white. The use of memo makes it only rerender when the isEqual function is false
const Heatmap = (props) => {
  return (
    <Plot
      data={[
        {
          showlegend: false,
          showscale: false,
          z: props.z_data,
          type: "heatmap",
          colorscale: "Jet",
        },
      ]}
      config={{
        responsive: true,
      }}
      layout={{
        width:
          window.innerWidth * 0.96 -
          6.5 * parseFloat(getComputedStyle(document.documentElement).fontSize),
        height:
          window.innerWidth * 0.48 -
          3.25 *
            parseFloat(getComputedStyle(document.documentElement).fontSize),
        margin: {
          l: 10,
          r: 10,
          t: 10,
          b: 10,
        },
        title: {
          text: " ",
        },
        xaxis: {
          visible: false,
          fixedrange: false,
        },
        yaxis: {
          visible: false,
          fixedrange: false,
        },
      }}
      useResizeHandler={true}
    />
  );
};

// A function to evaluate if two arrays of data are the same, by converting them to strings and comparing them
function isEqual(oldProps, newProps) {
  return (
    Array.from(oldProps.z_data).flat().join(",") ===
    Array.from(newProps.z_data).flat().join(",")
  );
}

function TriggerReadButton(props) {
  function Send() {
    //set the flag in the parameter tree to true to trigger a read
    props.endpoint
      .put({ ["refresh"]: true }, "application/bram/control")
      .then((response) => {
        props.endpoint.mergeData(response, "application/bram/control");
      })
      .catch((err) => {
        console.error(err);
      });
  }
  return (
    <input
      style={{ width: "100%" }}
      onClick={Send}
      className="nice-button"
      type="button"
      value={props.name}
    />
  );
}

//convert the array of data we are given into a 2d array, then create a heatmap using the plotly library (component defined separately) using that data
function BRAMFrameHeatmap(props) {

  if (props.frame_display_mode == 'stacked') {
      // Stack the data (which is one long line) into 64 lines of 128
      var stacked_data = [];
      for (let x = 0; x < 64; x++) {
        var temp = [];
        for (let y = 0; y < 128; y++) {
          temp.push(0);
          //temp.push([0, 1][Math.floor(Math.random() * 2)]);
        }
        stacked_data.push(temp);
      }
      for (
        let i = 0;
        i < props.framedict[props.frame_number].length;
        i++
      ) {
        stacked_data[63 - Math.floor(i / 128)][i % 128] =
          props.framedict[props.frame_number][i];
      }

      // Stacked rectangular heatmap
      return <OdinGraph title="Heatmap" data={stacked_data} type="heatmap"/>;
  } else if (props.frame_display_mode == 'line_heatmap') {
      // 'barcode' single line heatmap
      return <OdinGraph title="Heatmap" data={[props.framedict[props.frame_number]]} type="heatmap"/>;
  } else if (props.frame_display_mode == 'line') {
      // single line line graph
      return <OdinGraph title="Heatmap" data={props.framedict[props.frame_number]}/>;
  } else {
      return (
          <p style={{color:"red"}}>
              Unsupported frame display mode '{frame_display_mode}'
          </p>
      )
  }

}

function FrameDisplayModeSelect(props) {
    function Send(event, mode) {
        if (event.target.checked) {
            console.log(mode);
            props.mode_set_callback(mode);
        }
    }
    return (
        <Form>
            <div key={`inline-radio`} className="mb-3">
                <Form.Check
                    inline
                    label="stacked"
                    name="group1"
                    type={'radio'}
                    id={`inline-radio-1`}
                    onClick={(event) => Send(event, "stacked")}
                />
                <Form.Check
                    inline
                    label="line_heatmap"
                    name="group1"
                    type={'radio'}
                    id={`inline-radio-1`}
                    onClick={(event) => Send(event, "line_heatmap")}
                />
                <Form.Check
                    inline
                    label="line"
                    name="group1"
                    type={'radio'}
                    id={`inline-radio-1`}
                    onClick={(event) => Send(event, "line")}
                />
            </div>
        </Form>
    )
}


function BRAMFrames(props) {
    // Shared frame display mode for all single-bit frames
    const [frame_display_mode, setFrameDisplayMode] = useState('stacked');

    var framerows = [];
    for (let frame_number of Object.keys(props.periodicEndpoint.data.application.bram.data)) {
        var title = "BRAM Output frame " + frame_number;
        framerows.push(
            <Col xxl={6}>
          <TitleCard title={title}>
            {props.periodicEndpoint.data.application.bram.data[frame_number] != null ? (
              <BRAMFrameHeatmap framedict={props.periodicEndpoint.data.application.bram.data} frame_number={frame_number} frame_display_mode={frame_display_mode}/>
            ) : (
              <>
                <p style={{ color: "red" }}>
                  Error - no data received from garud detector adapter
                </p>
              </>
            )}
          </TitleCard>
            </Col>
        );
    }
    return (
        <Col>
        <TitleCard title={<Row><Col>"Single bit frames"</Col><Col><FrameDisplayModeSelect  mode_set_callback={setFrameDisplayMode}/></Col></Row>}>
            <Row>
                {framerows}
            </Row>
        </TitleCard>
        </Col>
    );
}

function BRAMCombinedFrame(props) {
    const [frame_display_mode, setFrameDisplayMode] = useState('stacked');

    var title = "BRAM Combined frames  " + props.periodicEndpoint.data.application.bram.control.display_start_frame + " - " + (props.periodicEndpoint.data.application.bram.control.display_start_frame + props.periodicEndpoint.data.application.bram.control.display_num_frames - 1);
    if (props.periodicEndpoint.data.application.bram.control.display_combined && (Object.keys(props.periodicEndpoint.data.application.bram.combined)).length > 0) {
        return (
        <Col>
          <TitleCard title={<Row><Col>{title}</Col><Col><FrameDisplayModeSelect  mode_set_callback={setFrameDisplayMode}/></Col></Row>}>
            {props.periodicEndpoint.data.application.bram.combined != null ? (
              <BRAMFrameHeatmap framedict={props.periodicEndpoint.data.application.bram.combined} frame_number={0} frame_display_mode={frame_display_mode}/>
            ) : (
              <>
                <p style={{ color: "red" }}>
                  Error - no data received from garud detector adapter
                </p>
              </>
            )}
          </TitleCard>
        </Col>
        );
    } else {
        return (<></>);
    }
}


const BRAMExportButton_DisplayedTrigger = WithEndpoint(Button);
const BRAMExportButton_RAWTrigger = WithEndpoint(Button);
const BRAMExportButton_ConversionTrigger = WithEndpoint(Button);
function BRAMExportControls(props) {
    return (
      <TitleCard title="Export">
        <Stack gap={1}>
            <Row>
                <Col>
                    {props.periodicEndpoint.data.application.bram.export.status.error != null ? (
                        <p style={{color:"red"}}>Error: {props.periodicEndpoint.data.application.bram.export.status.error}</p>
                    ) : (
                        <>
                        {props.periodicEndpoint.data.application.bram.export.status.done == true ? (
                            <p style={{color:"green"}}>Done - exported to {props.periodicEndpoint.data.application.bram.export.status.last_successful_export} in {props.periodicEndpoint.data.application.bram.export.status.time_s}s</p>
                        ) : (
                            <p></p>
                        )}
                        </>
                    )}
                    <Stack gap={1}>
                        <InputGroup>
                          <InputGroup.Text>Export Directory</InputGroup.Text>
                          <EndpointInput endpoint={props.periodicEndpoint} fullpath="application/bram/export/shared_settings/export_directory"/>
                        </InputGroup>
                        <InputGroup>
                          <InputGroup.Text>Export Filename</InputGroup.Text>
                          <EndpointInput endpoint={props.periodicEndpoint} fullpath="application/bram/export/shared_settings/export_filename"/>
                        </InputGroup>
                    </Stack>
                </Col>
            </Row>
            <Row>
                <Col>
                  <TitleCard title="Mode 1 - Displayed Readings" >
                    <BRAMExportButton_DisplayedTrigger endpoint={props.periodicEndpoint} fullpath="application/bram/export/modes/displayed/trigger" value={true} variant="success">
                      Export Displayed Frames
                    </BRAMExportButton_DisplayedTrigger>
                  </TitleCard>
                </Col>
                <Col>
                  <TitleCard title="Mode 2 - BlockRAM Conversion" >
                    <BRAMExportButton_ConversionTrigger endpoint={props.periodicEndpoint} fullpath="application/bram/export/modes/bram_converted/trigger" value={true} variant="success">
                      Export and Convert BRAM Pixels
                    </BRAMExportButton_ConversionTrigger>
                  </TitleCard>
                </Col>
                <Col>
                  <TitleCard title="Mode 3 - BlockRAM Raw Binary" >
                    <BRAMExportButton_RAWTrigger endpoint={props.periodicEndpoint} fullpath="application/bram/export/modes/bram_raw/trigger" value={true} variant="success">
                      Export Raw BlockRAM Contents
                    </BRAMExportButton_RAWTrigger>
                  </TitleCard>
                </Col>
            </Row>
        </Stack>
      </TitleCard>
    );
}

function BRAMDisplayTrigger(props) {
    var refreshdate = new Date(props.periodicEndpoint.data.application.bram.control.refresh * 1000)
    return (
      <TitleCard title="Display Trigger">
        <Row>
        <Col>
          <TitleCard title="Trigger Reads">
            <div className="mytooltip">
              <TriggerReadButton
                endpoint={props.periodicEndpoint}
                name={"Refresh (" + refreshdate.toLocaleTimeString("en-GB") + ")"}
              />
              {
                <span className="mytooltiptext">
                  {"Function: _bram_refresh"}
                </span>
              }
            </div>
            <div style={{ width: "100%", height: "20px" }}></div>
          </TitleCard>
        </Col>
        <Col>
          <TitleCard title="Read settings">
            <div className="mytooltip">
              <DisplayFrameStartInput periodicEndpoint={props.periodicEndpoint} />
              {
                <span className="mytooltiptext">
                  {"Function: UPDATEME"}
                </span>
              }
            </div>
            <div style={{ width: "100%", height: "20px" }}></div>
            <div className="mytooltip">
              <DisplayFrameNumInput periodicEndpoint={props.periodicEndpoint} />
              {
                <span className="mytooltiptext">
                  {"Function: UPDATEME"}
                </span>
              }
            </div>
          </TitleCard>
        </Col>
        </Row>
      </TitleCard>
    );
}

export default function BRAM_View(props) {
  return (
    <div className="odin-server">
      {Object.keys(props.periodicEndpoint.data).length > 0 ? (
      <Stack gap={2}>
        <Row>
          <Col xl={12} xxl={6}>
              <BRAMDisplayTrigger periodicEndpoint={props.periodicEndpoint} />
          </Col>
          <Col xl={12} xxl={6}>
              <BRAMExportControls periodicEndpoint={props.periodicEndpoint} />
          </Col>
          <br />
        </Row>
        <Row>
          <BRAMCombinedFrame periodicEndpoint={props.periodicEndpoint} />
        </Row>
        <Row>
          <BRAMFrames periodicEndpoint={props.periodicEndpoint} />
        </Row>
      </Stack>
      ) : (
        <></>
      )}
    </div>
  );
}
