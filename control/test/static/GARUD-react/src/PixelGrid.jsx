import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { TitleCard } from "odin-react";
//import "odin-react/dist/index.css";

export default function PixelGrid(props) {
  //create a value to store when the mouse is pressed down, and update it whenever the mouse is pressed down or lifted up
  const [mouseDown, setMouseDown] = useState(false);
  document.body.onmousedown = () => setMouseDown(true);
  document.body.onmouseup = () => setMouseDown(false);
  //create an array of pixels to use for the canvas and fill it in with all 0s.
  const [pixels, set_pixels] = useState([]);
  if (pixels.length == 0) {
    var temp = [];
    for (let i = 0; i < props.gridSize; i++) {
      temp.push(0);
      set_pixels(temp);
    }
  }

  //Determines the colour we have currently selected (starts as the last colour in the list)
  const [activeColourIndex, setActiveColourIndex] = useState(
    props.colours.length - 1
  );
  // Create the colour choosing palette that goes above the canvas
  function get_palette(colours, activeColourIndex, setActiveColourIndex) {
    let html = [];
    // create a list, with each entry being a colour option from the canvas - a box containing the colour.
    // The border of the box will be green if it is the selected colour, grey if it is not the selected color.
    for (let i = 0; i < colours.length; i++) {
      var colour = "#ccc";
      if (i === activeColourIndex) {
        colour = "green";
      }
      html.push(
        <span
          key={i}
          style={{
            borderColor: colour,
            borderWidth: "2px",
            borderStyle: "Solid",
            width: "20px",
            height: "20px",
            display: "inline-block",
            margin: "auto 5px",
            backgroundColor: colours[i],
          }}
          onClick={(event) => setActiveColourIndex(i)}
          data-index={i}
          className={i === activeColourIndex ? "selected" : ""}
        ></span>
      );
    }
    return html;
  }
  // This function is run when a pixel is clicked.
  // It takes in a list of the pixels and the current colour, and sets the pixel that was clicked to the current colour
  function setPixel(
    event,
    pixels,
    set_pixels,
    activeColourIndex,
    mouseDown = true
  ) {
    if (mouseDown) {
      // We have to create a copy of the list, because the list will be using useState so we cannot edit it directly.
      var temp = [];
      for (var i = 0; i < pixels.length; i++) {
        temp.push(pixels[i]);
      }
      temp[event.target.dataset.offset] = activeColourIndex;
      // Write the copied list back to the array of pixels
      set_pixels(temp);
    }
  }

  //iterate through each pixel in this row of the grid, create a table entry for it and fill that cell with the appropriate colour
  function get_pixel_row(
    pixels,
    set_pixels,
    i,
    activeColourIndex,
    colours,
    mouseDown
  ) {
    let html = [];
    for (let col = 0; col < props.gridWidth; col++) {
      html.push(
        // <td
        //   style={{
        //     width: "10px",
        //     height: "10px",
        //     userSelect: "none",
        //     backgroundColor: colours[pixels[i[0]]],
        //   }}
        //   onPointerEnter={(event) =>
        //     setPixel(event, pixels, set_pixels, activeColourIndex, mouseDown)
        //   }
        //   onPointerDown={(event) =>
        //     setPixel(event, pixels, set_pixels, activeColourIndex)
        //   }
        //   data-offset={i[0]}
        // />

        <div
          key={col}
          style={{
            width:
              String(
                (window.innerWidth * 0.96 -
                  6.5 *
                    parseFloat(
                      getComputedStyle(document.documentElement).fontSize
                    )) /
                  props.gridWidth
              ) + "px",
            height:
              String(
                (window.innerWidth * 0.96 -
                  6.5 *
                    parseFloat(
                      getComputedStyle(document.documentElement).fontSize
                    )) /
                  props.gridWidth
              ) + "px",
            userSelect: "none",
            backgroundColor: colours[pixels[i[0]]],
          }}
          onPointerEnter={(event) =>
            setPixel(event, pixels, set_pixels, activeColourIndex, mouseDown)
          }
          onPointerDown={(event) =>
            setPixel(event, pixels, set_pixels, activeColourIndex)
          }
          data-offset={i[0]}
        />
      );
      i[0] = i[0] + 1;
    }
    return html;
  }

  //iterate through each row in the grid, and create that row
  function get_pixel_grid(
    pixels,
    set_pixels,
    activeColourIndex,
    colours,
    mouseDown
  ) {
    let html = [];
    let i = [0];
    for (let row = 0; row < 64; row++) {
      html.push(
        //<tr>{
        get_pixel_row(
          pixels,
          set_pixels,
          i,
          activeColourIndex,
          colours,
          mouseDown
        )
        //}</tr>
      );
    }
    return html;
  }

  //Convert the array of pixels to a string so they can be copied to clipboard and used elsewhere
  function get_text() {
    return pixels.join(",");
  }

  //write the value of the pixels to the adapter
  function Send() {
    props.endpoint
      .put({ ["transfer"]: pixels }, "application/debugreg")
      .then((response) => {
        props.endpoint.mergeData(response, "application/debugreg");
      })
      .catch((err) => {
        console.error(err);
      });
  }

  return (
    <TitleCard
      title={
        <>
          <p style={{ float: "left" }}>{props.title}</p>
          <input
            style={{ float: "right", marginRight: "5px" }}
            onClick={() => navigator.clipboard.writeText(get_text())}
            className="nice-button"
            type="button"
            value="Get"
          />
          <input
            style={{ float: "right", marginRight: "5px" }}
            onClick={Send}
            className="nice-button"
            type="button"
            value="Send"
          />
        </>
      }
    >
      <div style={{}}>
        <div id="palette" style={{ marginRight: "auto", marginLeft: "auto" }}>
          {get_palette(props.colours, activeColourIndex, setActiveColourIndex)}
        </div>
        <div id="pixelGrid" style={{ marginRight: "auto", marginLeft: "auto" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              width:
                String(
                  window.innerWidth * 0.96 -
                    6.5 *
                      parseFloat(
                        getComputedStyle(document.documentElement).fontSize
                      )
                ) + "px",
            }}
          >
            {get_pixel_grid(
              pixels,
              set_pixels,
              activeColourIndex,
              props.colours,
              mouseDown
            )}
          </div>
          {/* <table
            style={{
              border: "1px black solid",
              borderCollapse: "collapse",
              touchAction: "none",
            }}
          >
            {get_pixel_grid(
              pixels,
              set_pixels,
              activeColourIndex,
              props.colours,
              mouseDown
            )}
          </table> */}
        </div>
      </div>
    </TitleCard>
  );
}
