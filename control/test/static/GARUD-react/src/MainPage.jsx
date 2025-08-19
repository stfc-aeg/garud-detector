import PowerDisplay from "./PowerSupplies";
import { DropdownButton, Dropdown } from "react-bootstrap";
import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { TitleCard } from "odin-react";

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
        <PowerDisplay periodicEndpointPower={props.periodicEndpointPower} />
        <br />
        <ClockConfigSelect periodicEndpoint={props.periodicEndpoint} />
      </TitleCard>
      <br />
    </div>
  );
}
