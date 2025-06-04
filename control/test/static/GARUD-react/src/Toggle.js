import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect, forwardRef } from "react";
import InputGroup from "react-bootstrap/InputGroup";
import Switch from "react-switch";
import { format_string, getNested } from "./helperFunctions";

//Ashley's code for a toggleswitch (see odin-react repository on github), slightly edited,
//so that the label floats to the left and the toggle floats to the right as opposed to both floating to the left
export var ToggleSwitch = forwardRef((props, ref) => {
  const { checked, value, id, label, onClick, disabled } = props;
  const [ischecked, setIsChecked] = useState(checked);

  useEffect(() => {
    setIsChecked(!!checked);
  }, [checked]);

  const toggle = (check, event) => {
    setIsChecked(check);
    event.target.value = check;
    onClick(event);
  };
  //the color can be set using the props but it defaults to grey if not provided
  var color;
  if (props.color == undefined) {
    color = "#f8f8f8";
  } else {
    color = props.color;
  }
  //update the color of the text based on the colour of the toggle, so that the text always stands out
  var textcolor;
  if (color[0] == "#" && color.length == 7) {
    var red = Number("0x" + color.slice(1, 3));
    var green = Number("0x" + color.slice(3, 5));
    var blue = Number("0x" + color.slice(5, 7));
    if (red * 0.299 + green * 0.587 + blue * 0.114 > 186) {
      textcolor = "#000000";
    } else {
      textcolor = "#ffffff";
    }
  } else {
    textcolor = "#000000";
  }
  return (
    <InputGroup.Text style={{ backgroundColor: color }}>
      <p id="label" style={{ fontSize: "1.00vw", color: textcolor }}>
        {label}
      </p>
      <div style={{ width: "55px", marginLeft: "2px" }}>
        <div style={{ float: "right" }}>
          <Switch
            ref={ref}
            checked={Boolean(ischecked)}
            onChange={toggle}
            disabled={disabled}
            onColor="#86d3ff"
            onHandleColor="#2693e6"
            handleDiameter={25}
            boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
            activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
            height={20}
            width={48}
            aria-labelledby={id}
          />
        </div>
      </div>
    </InputGroup.Text>
  );
});

/**
 * The Toggle function is a react functional component, consisting of a div containing a single toggleswitch,
 * which updates a parameter tree when toggled by sending a PUT request to an endpoint and merging the response data.
 * @param props - Props are the properties passed to a React component. In this code snippet, the
 * `Toggle` component receives props such as `endpoint`, `accessor`, and `path`. These props are used
 * to update the parameter tree when the toggle switch is clicked.
 * @returns The `Toggle` component is being returned, which contains a `ToggleSwitch` component with
 * specific props such as label, onClick function, and checked status based on the data from the
 * endpoint.
 */
export var Toggle = React.forwardRef((props, ref) => {
  //update the parameter tree when toggled
  function onToggled(event) {
    var valToPut = Number(event.target.value);
    if (!props.number) {
      valToPut = event.target.value;
    }
    props.endpoint
      .put({ [props.accessor]: valToPut }, props.path.join("/"))
      .then((response) => {
        props.endpoint.mergeData(response, props.path.join("/"));
      })
      .catch((err) => {
        console.error(err);
      });
  }

  //format the label, adding capital letters and replacing underscores with spaces
  var label = format_string(String(props.accessor));
  if (props.label != undefined) {
    label = props.label;
  }

  return (
    <div style={{ width: "24%", marginBottom: "1%" }}>
      <ToggleSwitch
        disabled={props.disabled}
        ref={ref}
        label={label}
        onClick={onToggled}
        color={props.color}
        checked={
          props.endpoint?.data
            ? Boolean(
                getNested(props.endpoint.data, props.path)[props.accessor]
              )
            : false
        }
      />
    </div>
  );
});
