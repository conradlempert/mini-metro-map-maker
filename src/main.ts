let activeTool = "selectTool";
const canvas = $("#mainCanvas")[0] as HTMLCanvasElement;
const context = canvas.getContext("2d") as CanvasRenderingContext2D;
context.globalAlpha = 0.4;
let elements: Marker[] = [];
const markerSize = 6;
const relativeFontSize = 1.5;
let imageObject: HTMLImageElement;
let screenScale = 1;
let coordsOrigin = { x: 0, y: 0 };
let pressingShift = false;
let moved = false;
let picked: Marker | undefined;
let changed = false;
let desaturate = false;

type AnyMouseEvent =
  | MouseEvent
  | JQuery.MouseMoveEvent
  | JQuery.MouseDownEvent
  | JQuery.MouseUpEvent;

type AnyKeyboardEvent = KeyboardEvent | JQuery.KeyDownEvent | JQuery.KeyUpEvent;
interface ExportJson {
  version: string;
  width: number;
  height: number;
  elements: any[];
  desaturate: boolean;
  origin: Point;
  image?: string;
}

interface Point {
  x: number;
  y: number;
}

interface Marker {
  type: "singleMarker" | "polygon";
  selected: boolean;
}

interface SingleMarker extends Marker {
  x: number;
  y: number;
  type: "singleMarker";
}

interface Polygon extends Marker {
  positions: Point[];
  pickedPosition: number;
  type: "polygon";
}

$("#newMap").on("click", newMap);
$("#uploadMapButton").on("click", uploadMap);
$("#uploadMapFile").on("change", processMap);
$("#selectTool").on("click", () => chooseTool("selectTool"));
$("#markerTool").on("click", () => chooseTool("markerTool"));
$("#polygonTool").on("click", () => chooseTool("polygonTool"));
$("#export").on("click", exportData);
$("#help").on("click", showHelp);
$("#closeModalButton").on("click", closeModal);
$("#createCityMapButton").on("click", createCityMap);
$("#closeHelp").on("click", closeHelp);

window.onbeforeunload = function (e: BeforeUnloadEvent): string | null {
  if (changed) {
    const text =
      "Are you sure you want to leave? Download your shapes as JSON to save your progress.";
    (e || window.event).returnValue = text;
    return text;
  } else {
    return null;
  }
};

function newMap(): void {
  $("#start").hide();
  $("#createModal").show();
}
function uploadMap(): void {
  $("#uploadMapFile").trigger("click");
}
function closeModal(): void {
  $("#start").show();
  $("#createModal").hide();
}
function showHelp(): void {
  $("#helpModal").show();
}
function closeHelp(): void {
  $("#helpModal").hide();
}
function processMap(): void {
  const file = $("#uploadMapFile").prop("files")[0];
  if (file) {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.addEventListener("load", (event) => {
      const reader = event.target as FileReader;
      var result = JSON.parse(reader.result as string);
      elements = result.elements;
      canvas.width = result.width;
      canvas.height = result.height;
      desaturate = result.desaturate;
      if (result.image) {
        drawDataURLToCanvas(result.image);
      } else {
        $("#backgroundCanvas").hide();
      }
      initHTMLAndEvents();
      coordsOrigin = result.origin;
      drawEverything();
    });
  }
}
function createCityMap(): void {
  desaturate = $("#desaturate").prop("checked");
  const file = $("#background_image").prop("files")[0];

  canvas.width = parseInt($("#city_width").val() as string);
  canvas.height = parseInt($("#city_height").val() as string);
  initHTMLAndEvents();
  coordsOrigin = {
    x: parseInt($("#origin_x").val() as string),
    y: parseInt($("#origin_y").val() as string),
  };
  if (file) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.addEventListener("load", () => {
      drawDataURLToCanvas(reader.result as string);
    });
  } else {
    $("#backgroundCanvas").hide();
  }
  changed = true;
}
function drawDataURLToCanvas(dataURL: string): void {
  imageObject = new Image();
  imageObject.onload = function () {
    drawBackground();
  };
  imageObject.src = dataURL;
}
function initHTMLAndEvents(): void {
  $("#start").hide();
  $("#createModal").hide();
  $("#mainWrapper").css("display", "inline-block");
  $("#clipboardWrapper").css("display", "inline-block");
  $("#canvasContainer").width($(canvas).width() as number);
  $("#canvasContainer").height($(canvas).height() as number);
  $(document).on("mousemove", handleMouseMove);
  $(canvas).on("mousedown", handleMouseDown);
  $(document).on("mouseup", handleMouseUp);
  $(document).on("keydown", handleKeyDown);
  $(document).on("keyup", handleKeyUp);
  screenScale = canvas.height / canvas.getBoundingClientRect().height;
}
function chooseTool(toolName: string): void {
  if (activeTool !== toolName) {
    $("#" + activeTool)
      .removeClass("btn-dark")
      .addClass("btn-outline-dark");
    $("#" + toolName)
      .removeClass("btn-outline-dark")
      .addClass("btn-dark");
    activeTool = toolName;
    unselect();
  }
}
function displayCoordinates(event: AnyMouseEvent): void {
  if (inCity(event)) {
    const city = eventToCity(event);
    $("#coordinate").text(city.x + ", " + city.y);
  } else {
    $("#coordinate").html("&nbsp;");
  }
}
function inCity(event: AnyMouseEvent): boolean {
  const x = event.clientX;
  const y = event.clientY;
  const rect = canvas.getBoundingClientRect();
  return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
}
function eventToCity(event: AnyMouseEvent): Point {
  const x = event.clientX;
  const y = event.clientY;
  const rect = canvas.getBoundingClientRect();
  const scaledX =
    ((x - rect.left) / rect.width) * canvas.width - coordsOrigin.x;
  const scaledY = -(
    ((y - rect.top) / rect.height) * canvas.height -
    coordsOrigin.y
  );
  return {
    x: Math.round(scaledX),
    y: Math.round(scaledY),
  };
}
function cityToCanvas(city: Point): Point {
  return {
    x: city.x + coordsOrigin.x,
    y: -city.y + coordsOrigin.y,
  };
}
function cityToEvent(city: Point): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((city.x + coordsOrigin.x) / canvas.width) * rect.width + rect.left,
    y: ((-city.y + coordsOrigin.y) / canvas.height) * rect.height + rect.top,
  };
}
function handleMouseDown(event: AnyMouseEvent): void {
  const result = pick(event);
  if (result) {
    picked = result;
    canvas.style.cursor = "grabbing";
  }
  moved = false;
}
function handleMouseMove(event: AnyMouseEvent): void {
  displayCoordinates(event);
  moved = true;
  if (picked) {
    const selection = document.getSelection() as Selection;
    selection.removeAllRanges();
    dragPickedObject(event);
  } else {
    if (pick(event)) {
      canvas.style.cursor = "pointer";
    } else {
      canvas.style.cursor = "initial";
    }
  }
}
function handleMouseUp(event: AnyMouseEvent): void {
  if (picked && !moved) {
    handleElementClicked();
  }
  if (!picked && !moved) {
    handleClick(event);
  }
  if (picked) {
    copyFromElement(picked);
  }
  picked = undefined;
  moved = false;
}
function dragPickedObject(event: AnyMouseEvent): void {
  changed = true;
  if (inCity(event)) {
    const coords = eventToCity(event);
    if (picked) {
      if (picked.type == "singleMarker") {
        (picked as SingleMarker).x = coords.x;
        (picked as SingleMarker).y = coords.y;
      } else if (picked.type == "polygon") {
        const pos = (picked as Polygon).positions[
          (picked as Polygon).pickedPosition
        ];
        pos.x = coords.x;
        pos.y = coords.y;
      }
    }
  }
  if (getSelected() !== picked) {
    selectElement(picked as Marker);
  }
  drawEverything();
}
function handleClick(event: AnyMouseEvent): void {
  if (!inCity(event)) {
    return;
  }
  if (activeTool === "markerTool") {
    const point = eventToCity(event);
    const marker: SingleMarker = {
      x: point.x,
      y: point.y,
      selected: false,
      type: "singleMarker",
    };
    elements.push(marker);
    selectElement(marker);
    changed = true;
  } else if (activeTool === "polygonTool") {
    const position = eventToCity(event);
    const selected = getSelected();
    if (selected && selected.type === "polygon") {
      (selected as Polygon).positions.push(position);
      copyFromElement(selected);
      drawEverything();
    } else {
      const newPolygon: Polygon = {
        type: "polygon",
        positions: [position],
        selected: false,
        pickedPosition: -1,
      };
      elements.push(newPolygon);
      selectElement(newPolygon);
    }
    changed = true;
  } else if (activeTool === "selectTool") {
    unselect();
  }
}
function handleElementClicked(): void {
  if (picked) {
    if (!pressingShift) {
      selectElement(picked);
    } else {
      deleteSingleMarker(picked);
    }
  }
}

function deleteSingleMarker(element: Marker) {
  changed = true;
  if (
    element.type == "singleMarker" ||
    (element.type == "polygon" && (element as Polygon).positions.length === 1)
  ) {
    selectElement(element);
    deleteSelected();
  } else {
    const index = (element as Polygon).pickedPosition;
    (element as Polygon).positions.splice(index, 1);
    drawEverything();
  }
}
function drawBackground() {
  const bgCanvas = $("#backgroundCanvas")[0] as HTMLCanvasElement;
  bgCanvas.width = canvas.width;
  bgCanvas.height = canvas.height;
  const bgContext = bgCanvas.getContext("2d") as CanvasRenderingContext2D;
  if (desaturate) {
    bgContext.globalAlpha = 0.4;
  }
  bgContext.drawImage(imageObject, 0, 0, bgCanvas.width, bgCanvas.height);
}
function drawEverything() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  elements.forEach((element) => {
    if (element.type === "singleMarker") {
      drawMarker(element as SingleMarker, element.selected);
    } else if (element.type === "polygon") {
      drawPolygon(element as Polygon);
    }
  });
}
function drawPolygon(polygon: Polygon) {
  polygon.positions.forEach((position) => {
    drawMarker(position, polygon.selected);
  });

  context.beginPath();
  context.strokeStyle = polygon.selected ? "red" : "black";
  context.lineWidth = 3;
  const first = cityToCanvas(polygon.positions[0]);
  context.moveTo(first.x, first.y);
  polygon.positions.slice(1).forEach((position) => {
    const pos = cityToCanvas(position);
    context.lineTo(pos.x, pos.y);
  });
  context.lineTo(first.x, first.y);
  context.closePath();
  context.stroke();
}
function drawMarker(marker: Point, selected: boolean) {
  const coords = cityToCanvas(marker);
  const size = markerSize * screenScale;
  if (selected) {
    context.fillStyle = "red";
    context.font = size * relativeFontSize + "px Arial";
    context.textAlign = "center";
    context.fillText(marker.x + ", " + marker.y, coords.x, coords.y - size * 2);
  } else {
    context.fillStyle = "black";
  }

  context.fillRect(coords.x - size / 2, coords.y - size / 2, size, size);
}
function copyFromElement(element: Marker): void {
  let text = "";
  if (element.type == "singleMarker") {
    text = JSON.stringify([
      (element as SingleMarker).x,
      (element as SingleMarker).y,
    ]);
  } else if (element.type == "polygon") {
    text = JSON.stringify(
      (element as Polygon).positions.map((position) => [position.x, position.y])
    );
  }

  copyToClipboard(text);
}
function copyToClipboard(text: string): void {
  var textArea = document.createElement("textarea");
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.width = "2em";
  textArea.style.height = "2em";
  textArea.style.padding = "0";
  textArea.style.border = "none";
  textArea.style.outline = "none";
  textArea.style.boxShadow = "none";
  textArea.style.background = "transparent";
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
    $("#clipboard").text(text);
  } catch (err) {
    $("#clipboard").text("Error while copying text");
  }
  document.body.removeChild(textArea);
}
function getSelected(): Marker | undefined {
  return elements.find((element) => element.selected);
}
function selectElement(marker: Marker): void {
  const selected = getSelected();
  if (selected) {
    selected.selected = false;
  }
  marker.selected = true;
  copyFromElement(marker);
  drawEverything();
}
function pick(event: AnyMouseEvent): Marker | undefined {
  const size2 = markerSize / 2;
  const pickedElement = elements.find((element) => {
    if (element.type == "singleMarker") {
      const m = cityToEvent(element as SingleMarker);
      if (
        event.clientX > m.x - size2 &&
        event.clientX < m.x + size2 &&
        event.clientY > m.y - size2 &&
        event.clientY < m.y + size2
      ) {
        return true;
      }
    } else if (element.type == "polygon") {
      return (element as Polygon).positions.some((position, index) => {
        const m = cityToEvent(position);
        if (
          event.clientX > m.x - size2 &&
          event.clientX < m.x + size2 &&
          event.clientY > m.y - size2 &&
          event.clientY < m.y + size2
        ) {
          (element as Polygon).pickedPosition = index;
          return true;
        }
      });
    }
  });
  return pickedElement;
}
function deleteSelected(): void {
  changed = true;
  const selected = getSelected();
  if (selected) {
    const index = elements.indexOf(selected);
    elements.splice(index, 1);
    copyToClipboard("");
    drawEverything();
  }
}
function handleKeyUp(event: AnyKeyboardEvent): void {
  if (event.keyCode == 8) {
    deleteSelected();
  }
  if (event.keyCode == 27) {
    unselect();
  }
  if (event.keyCode == 16) {
    pressingShift = false;
  }
}
function handleKeyDown(event: AnyKeyboardEvent): void {
  if (event.keyCode == 16) {
    pressingShift = true;
    (document.getSelection() as Selection).removeAllRanges();
  }
}
function unselect(): void {
  const selected = getSelected();
  if (selected) {
    selected.selected = false;
    drawEverything();
  }
  copyToClipboard("");
}
function exportData(): void {
  changed = false;
  const json: ExportJson = {
    version: "1.0",
    width: canvas.width,
    height: canvas.height,
    elements: elements,
    desaturate: desaturate,
    origin: coordsOrigin,
  };
  if (imageObject) {
    json.image = imageObject.src;
  }
  let link = document.createElement("a");
  link.download = "shapes.json";
  link.href =
    "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json));
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
