import PowerDisplay from "./PowerSupplies";
import { DropdownButton, Dropdown, Row, Col, Button } from "react-bootstrap";
import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { TitleCard, WithEndpoint } from "odin-react";

function ClockConfigSelect(props) {
  const [clockGenSetting, setClockGenSetting] = useState("Loading");
  function applySetting(event) {
    setClockGenSetting(event);
    var valueToSend = event;
    if (valueToSend == "None") {
      valueToSend = null;
    }
    props.periodicEndpoint
      .put({ ["config_file"]: valueToSend }, "clkgen")
      .then((response) => {
        props.periodicEndpoint.mergeData(response, "clkgen");
      })
      .catch((err) => {
        console.error(err);
      });
  }

  if (Object.keys(props.periodicEndpoint.data).length > 0) {
    if (
      Object.keys(props.periodicEndpoint.data).length > 0 &&
      clockGenSetting == "Loading"
    ) {
      setClockGenSetting(props.periodicEndpoint.data.clkgen.config_file);
      if (!clockGenSetting) {
        setClockGenSetting("None");
      }
    }
    return (
      <TitleCard title="Clock Generator Settings">
        <p style={{ display: "inline-block" }}>Clock Generator Config File:</p>{" "}
        &nbsp;
        <div style={{ display: "inline-block" }}>
          <div className="mytooltip">
            <DropdownButton
              title={clockGenSetting || "None"}
              onSelect={applySetting}
            >
              {props.periodicEndpoint.data.clkgen.config_files_avail.map(
                (selection, index) => (
                  <Dropdown.Item
                    eventKey={selection}
                    key={index}
                    active={selection == clockGenSetting}
                  >
                    {selection}
                  </Dropdown.Item>
                )
              )}
            </DropdownButton>
            {<span className="mytooltiptext">{"Function name"}</span>}
          </div>
        </div>
      </TitleCard>
    );
  } else {
    return (
      <TitleCard title="Clock Generator Settings">
        <p style={{ color: "red" }}>
          Error - no data received from garud detector adapter
        </p>
      </TitleCard>
    );
  }
}

const InitialiseButton_Cycle = WithEndpoint(Button);
const InitialiseButton_PSUsToggle = WithEndpoint(Button);
const InitialiseButton_ASICRegsToggle = WithEndpoint(Button);
function Initialisation(props) {
    console.log('test')
    console.log(props.periodicEndpoint);
    console.log(props.periodicEndpoint.data);
    if (props.periodicEndpoint != undefined) {
        return(
            <TitleCard title="Init Control">
                <Row>
                    <Col>
                        <InitialiseButton_Cycle endpoint={props.periodicEndpoint} fullpath="application/main_control/initialise" value={true} variant={props.periodicEndpoint.data.application.main_control.initialise ? ("success") : ("danger")}>
                        {props.periodicEndpoint.data.application.main_control.initialise ? ("Re-initialise") : (<b>Initialise</b>)}
                        </InitialiseButton_Cycle>
                    </Col>
                    <Col>
                        <InitialiseButton_ASICRegsToggle endpoint={props.periodicEndpoint} fullpath="application/main_control/autoinit_init_asic_regs" value={!props.periodicEndpoint.data.application.main_control.autoinit_init_asic_regs} variant={props.periodicEndpoint.data.application.main_control.autoinit_init_asic_regs ? ("success") : ("danger")}>
                        {props.periodicEndpoint.data.application.main_control.autoinit_init_asic_regs ? ("ASIC Regulators will cycle") : (<b>ASIC Regulators won't cycle</b>)}
                        </InitialiseButton_ASICRegsToggle>
                    </Col>
                </Row>
            </TitleCard>
        );
    } else {
        return <></>
    }
}

export default function Main(props) {
  return (
    <div className="odin-server">
      <TitleCard
        title={
          <>
            <p style={{ float: "left" }}>Controls</p>
          </>
        }
      >
        <Row>
            <Col xxl={6}>
                <Initialisation periodicEndpoint={props.periodicEndpoint} />
            </Col>
            <Col xxl={6}>
                <ClockConfigSelect periodicEndpoint={props.periodicEndpoint} />
            </Col>
            <Col xxl={12}>
                <PowerDisplay periodicEndpointPower={props.periodicEndpointPower} />
            </Col>
        </Row>
      </TitleCard>
      <br />
    </div>
  );
}
