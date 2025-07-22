import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { TitleCard } from "odin-react";
import { ToggleSwitch } from "./Toggle";
import { format_string } from "./helperFunctions";
import InputGroup from "react-bootstrap/InputGroup";

// calculate the power of each power supply, remove any negatives and sum them together, before rounding the power to four decimal places
function get_total_power(periodicEndpoint) {
  var total_power = 0;
  for (let supply of Object.keys(periodicEndpoint.data.ttipsu["devices"])) {
    for (let channel of Object.keys(
      periodicEndpoint.data.ttipsu["devices"][supply].channels
    )) {
      total_power += Math.abs(
        periodicEndpoint.data.ttipsu["devices"][supply].channels[channel]
          .voltage.output *
          periodicEndpoint.data.ttipsu["devices"][supply].channels[channel]
            .current.output
      );
    }
  }
  return Math.round(total_power * 10000) / 10000;
}

function PowerSupplyReadout(props) {
  var power_supply = [];
  //when the channel is toggled, send the value to the adapter to turn it on or off
  function onToggled(event, path, periodicEndpoint) {
    periodicEndpoint
      .put({ ["status"]: event.target.value }, path)
      .then((response) => {
        periodicEndpoint.mergeData(response, path);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  //iterate through each channel and create a box for it with a toggle to turn it on and off
  for (let channel of Object.keys(
    props.periodicEndpoint.data.ttipsu["devices"][props.supply].channels
  )) {
    power_supply.push(
      <div
        key={channel}
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          columnCount: "4",
        }}
      >
        <div className="WeirdAutoScale" style={{ float: "left" }}>
          <ToggleSwitch
            label={format_string("Channel " + String(channel))}
            onClick={(event) =>
              onToggled(
                event,
                "ttipsu/devices/" + props.supply + "/channels/" + channel,
                props.periodicEndpoint
              )
            }
            checked={
              props.periodicEndpoint.data.ttipsu["devices"][props.supply]
                .channels[channel].status
            }
          />
        </div>
        <div className="powerSupply">
          <InputGroup.Text style={{ paddingLeft: "0px", paddingRight: "0px" }}>
            <p
              style={{
                marginBottom: "0px",
                height: "33px",
                textAlign: "center",
                width: "100%",
              }}
            >
              {Math.abs(
                Math.round(
                  props.periodicEndpoint.data.ttipsu["devices"][props.supply]
                    .channels[channel].voltage.output * 1000
                ) / 1000
              ) + " V"}
            </p>
          </InputGroup.Text>
        </div>
        <div className="powerSupply">
          <InputGroup.Text style={{ paddingLeft: "0px", paddingRight: "0px" }}>
            <p
              style={{
                marginBottom: "0px",
                height: "33px",
                textAlign: "center",
                width: "100%",
              }}
            >
              {Math.abs(
                Math.round(
                  props.periodicEndpoint.data.ttipsu["devices"][props.supply]
                    .channels[channel].current.output * 1000
                ) / 1000
              ) + " A"}
            </p>
          </InputGroup.Text>
        </div>
        <div className="powerSupply">
          <InputGroup.Text style={{ paddingLeft: "0px", paddingRight: "0px" }}>
            <p
              style={{
                marginBottom: "0px",
                height: "33px",
                textAlign: "center",
                width: "100%",
              }}
            >
              {Math.abs(
                Math.round(
                  props.periodicEndpoint.data.ttipsu["devices"][props.supply]
                    .channels[channel].voltage.output *
                    props.periodicEndpoint.data.ttipsu["devices"][props.supply]
                      .channels[channel].current.output *
                    1000
                ) / 1000
              ) + " W"}
            </p>
          </InputGroup.Text>
        </div>
      </div>
    );
  }
  return power_supply;
}

function PowerSuppliesDisplay(props) {
  var power_supplies = [];

  //send a command to the adapter to enable the power supply
  function onToggled(event, path, periodicEndpoint) {
    periodicEndpoint
      .put({ ["remote_enable"]: event.target.value }, path)
      .then((response) => {
        periodicEndpoint.mergeData(response, path);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  //iterate through each power supply, and create a card with a toggle and the channels
  for (let supply of Object.keys(
    props.periodicEndpoint.data.ttipsu["devices"]
  )) {
    power_supplies.push(
      <div
        key={supply}
        style={{
          width: "48%",
          display: "inline-block",
          marginLeft: "1%",
          marginRight: "1%",
          minWidth: "440px",
        }}
      >
        <TitleCard
          title={
            <>
              <p style={{ float: "left" }}>
                {supply +
                  ". " +
                  props.periodicEndpoint.data.ttipsu["devices"][supply].id +
                  " hosted on " +
                  props.periodicEndpoint.data.ttipsu["devices"][supply].host}
              </p>
              <div style={{ width: "200px", float: "right" }}>
                <ToggleSwitch
                  label="Remote Access"
                  onClick={(event) =>
                    onToggled(
                      event,
                      "ttipsu/devices/" + supply + "/",
                      props.periodicEndpoint
                    )
                  }
                  checked={
                    props.periodicEndpoint.data.ttipsu["devices"][supply]
                      .remote_enable
                  }
                />
              </div>
            </>
          }
        >
          <PowerSupplyReadout
            periodicEndpoint={props.periodicEndpoint}
            supply={supply}
          />
        </TitleCard>
      </div>
    );
  }
  return power_supplies;
}

export default function PowerDisplay(props) {
  if (Object.keys(props.periodicEndpointPower.data).length > 0) {
    if (
      props.periodicEndpointPower.data.status.ttipsu.error &&
      props.periodicEndpointPower.data.status.ttipsu.error != "OK"
    ) {
      return (
        <TitleCard
          title={
            <>
              <p style={{ float: "left" }}>Power Supplies</p>
              <p style={{ float: "right" }}>{"Total Power: - W"}</p>
            </>
          }
        >
          <p style={{ color: "red" }}>
            Power Supply Error:{" "}
            {props.periodicEndpointPower.data.status.ttipsu.error}
          </p>
        </TitleCard>
      );
    } else {
      return (
        <>
          <TitleCard
            title={
              <>
                <p style={{ float: "left" }}>Power Supplies</p>
                <p style={{ float: "right" }}>
                  {"Total Power: " +
                    (Object.keys(props.periodicEndpointPower.data).length > 0
                      ? get_total_power(props.periodicEndpointPower)
                      : "-") +
                    " W"}
                </p>
              </>
            }
          >
            <PowerSuppliesDisplay
              periodicEndpoint={props.periodicEndpointPower}
            />
          </TitleCard>
        </>
      );
    }
  } else {
    return (
      <>
        <p style={{ color: "red" }}>
          Error - no data received from garud power supplies adapter:
        </p>
        <pre style={{ color: "red" }}>
          {JSON.stringify(props.periodicEndpointPower.data, null, " ")}
        </pre>
      </>
    );
  }
}
