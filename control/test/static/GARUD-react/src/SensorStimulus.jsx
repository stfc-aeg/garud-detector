import { getNested } from "./HelperFunctions";
import { Toggle } from "./Toggle";
import { TitleCard } from "odin-react";

function BitToggles(props) {
  var path = ["application", "gpio_direct"];
  var toggles = [];
  for (let key of Object.keys(getNested(props.periodicEndpoint.data, path))) {
    if (
      Object.keys(getNested(props.periodicEndpoint.data, path)[key]).includes(
        "mux_source_fw"
      ) &&
      !props.debugInputList.includes(key)
    ) {
      toggles.push(
        <div className="mytooltip" style={{ width: "24%" }}>
          <Toggle
            key={key}
            endpoint={props.periodicEndpoint}
            path={[...path, key]}
            accessor={"mux_source_fw"}
            label={key + " FW controlled?"}
            fixWidth="100%"
          />
          {
            <span className="mytooltiptext">
              {"Function: fw_sw_mux.set_input_direct"}
            </span>
          }
        </div>
      );
    }
  }
  return toggles;
}

export default function Sensor_Stimulus(props) {
  return (
    <div className="odin-server">
      <div
        style={{
          width: "100%",
        }}
      >
        <TitleCard title="FW/SW Sensor Stimulus">
          <div className="wrap-and-compress">
            {Object.keys(props.periodicEndpoint.data).length > 0 ? (
              <BitToggles
                periodicEndpoint={props.periodicEndpoint}
                debugInputList={props.debugInputList}
              />
            ) : (
              <p style={{ color: "red" }}>
                Error - no data received from garud detector adapter
              </p>
            )}
          </div>
        </TitleCard>
      </div>
    </div>
  );
}
