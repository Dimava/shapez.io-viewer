/*
 * Lots of code here is copied 1:1 from actual game files
 *
 */

/** @enum {string} */
const enumSubShape = {
	rect: "rect",
	circle: "circle",
	star: "star",
	windmill: "windmill",

	clover: "clover",
	star8: "star8",
	rhombus: "rhombus",
	plus: "plus",
	razor: "razor",
	sun: "sun",

	none: "none",
};

/** @enum {string} */
const enumSubShapeToShortcode = {
	[enumSubShape.rect]: "R",
	[enumSubShape.circle]: "C",
	[enumSubShape.star]: "S",
	[enumSubShape.windmill]: "W",

	[enumSubShape.clover]: "L",
	[enumSubShape.star8]: "T",
	[enumSubShape.rhombus]: "B",
	[enumSubShape.plus]: "P",
	[enumSubShape.razor]: "Z",
	[enumSubShape.sun]: "U",

	[enumSubShape.none]: "-",
};

/** @enum {enumSubShape} */
const enumShortcodeToSubShape = {};
for (const key in enumSubShapeToShortcode) {
	enumShortcodeToSubShape[enumSubShapeToShortcode[key]] = key;
}

const arrayQuadrantIndexToOffset = [
	{ x: 1, y: -1 }, // tr
	{ x: 1, y: 1 }, // br
	{ x: -1, y: 1 }, // bl
	{ x: -1, y: -1 }, // tl
];

// From colors.js
/** @enum {string} */
const enumColors = {
	red: "red",
	green: "green",
	blue: "blue",

	yellow: "yellow",
	purple: "purple",
	cyan: "cyan",

	white: "white",
	uncolored: "uncolored",

	black: "black",
};

/** @enum {string} */
const enumColorToShortcode = {
	[enumColors.red]: "r",
	[enumColors.green]: "g",
	[enumColors.blue]: "b",

	[enumColors.yellow]: "y",
	[enumColors.purple]: "p",
	[enumColors.cyan]: "c",

	[enumColors.white]: "w",
	[enumColors.uncolored]: "u",

	[enumColors.black]: "k",
};

/** @enum {string} */
const enumColorsToHexCode = {
	[enumColors.red]: "#ff666a",
	[enumColors.green]: "#78ff66",
	[enumColors.blue]: "#66a7ff",

	// red + green
	[enumColors.yellow]: "#fcf52a",

	// red + blue
	[enumColors.purple]: "#dd66ff",

	// blue + green
	// [enumColors.cyan]: "#87fff5",
	[enumColors.cyan]: "#00fcff",

	// blue + green + red
	[enumColors.white]: "#ffffff",

	[enumColors.uncolored]: "#aaaaaa",

	[enumColors.black]: "#333333",
};

/** @enum {enumColors} */
const enumShortcodeToColor = {};
for (const key in enumColorToShortcode) {
	enumShortcodeToColor[enumColorToShortcode[key]] = key;
}

/** @enum {string} */
const enumDefaultSubShapeColor = {
	[enumSubShape.clover]: enumColors.green,
	[enumSubShape.sun]: enumColors.yellow,
};

for (const key in enumSubShapeToShortcode) {
	enumShortcodeToSubShape[enumSubShapeToShortcode[key]] = key;
	if (!enumDefaultSubShapeColor[key]) enumDefaultSubShapeColor[key] = enumColors.uncolored;
}

CanvasRenderingContext2D.prototype.beginCircle = function(x, y, r) {
	if (r < 0.05) {
		this.beginPath();
		this.rect(x, y, 1, 1);
		return;
	}
	this.beginPath();
	this.arc(x, y, r, 0, 2.0 * Math.PI);
};

/////////////////////////////////////////////////////

function radians(degrees) {
	return (degrees * Math.PI) / 180.0;
}

/**
 * Generates the definition from the given short key
 */
function fromShortKey(key) {
	const sourceLayers = key.replace(/\s/g, '').split(":").filter(Boolean).map(parseShortKey);

	if (checkImpossible(sourceLayers.join(':'))) {
		showError(new Error(checkImpossible(sourceLayers.join(':'))));
	}

	if (sourceLayers.length > 4) {
		showError(new Error("Only 4 layers allowed"));
	}

	for (let i = 0; i < sourceLayers.length; ++i) {
		if (checkUnknown(sourceLayers[i])) {
			showError(new Error(checkUnknown(sourceLayers[i])));
		}
	}

	return formLayers(sourceLayers);

}

function formLayers(keys) {
	let layers = [];
	for (let i = 0; i < keys.length; ++i) {
		let text = keys[i];

		const quads = [null, null, null, null];
		for (let quad = 0; quad < 4; ++quad) {
			const shapeText = text[quad * 2 + 0];
			const subShape = enumShortcodeToSubShape[shapeText] || shapeText;
			const color = enumShortcodeToColor[text[quad * 2 + 1]] || enumColors.uncolored;
			quads[quad] = {
				subShape,
				color,
			};
		}
		layers.push(quads);
	}
	return layers;
}

function textToHTML(text) {
	const span = document.createElement('span');
	span.innerText = text;
	return span.innerHTML;
}



/**
 * Parse short key into a full one
 * @param {string} key
 * @returns {string}
 */
function parseShortKey(key) {
	const emptyLayer = '--'.repeat(4);
	const clr = (A, c) => A == '-' ? '-' : !c || c == '-' ? enumColorToShortcode[enumDefaultSubShapeColor[enumShortcodeToSubShape[A]]] || 'u' : c;

	const escKey = `<code>${textToHTML(key)}</code>`;

	if (!key) {
		return emptyLayer;
	}

	if (key.match(/[^A-Za-z:\-]/)) {
		let match = key.match(/[^A-Za-z:\-]/);
		showError(new Error(`key ${escKey} has invalid symbol: <code>${textToHTML(match[0])}</code>`));
	}

	if (key.length == 8) {
		if (!key.match(/^([A-Z\-][a-z\-]){4}$/)) {
			showError(new Error(`key ${escKey} is invalid`));
		}
		return key;
	}

	if (key.length == 1) {
		if (key == '-') {
			return emptyLayer;
		}
		// A -> AuAuAuAu
		if (key.match(/^[A-Z]$/)) {
			return `${key}${clr(key)}`.repeat(4);
		}
		showError(new Error(`key ${escKey} is invalid`));
	}

	if (key.length == 2) {
		// AB -> AuBuAuBu
		if (key.match(/^[A-Z\-]{2}$/)) {
			return `${key[0]}${clr(key[0])}${key[1]}${clr(key[1])}`.repeat(2);
		}
		// Ac -> AcAcAcAc
		if (key.match(/^[A-Z\-][a-z\-]$/)) {
			return `${key[0]}${clr(key[0], key[1])}`.repeat(4);
		}
		showError(new Error(`key ${escKey} is invalid`));
	}

	if (key.length == 4) {
		// ABCD -> AuBuCuDu
		if (key.match(/^[A-Z\-]{4}$/)) {
			return `${key[0]}${clr(key[0])}${key[1]}${clr(key[1])}${key[2]}${clr(key[2])}${key[3]}${clr(key[3])}`;
		}
		// AcBd -> AcBdAcBd
		if (key.match(/^([A-Z\-][a-z\-]){2}$/)) {
			return `${key[0]}${clr(key[0], key[1])}${key[2]}${clr(key[2], key[3])}`.repeat(2);
		}
		showError(new Error(`key ${escKey} is invalid`));
	}

	showError(new Error(`key ${escKey} has invalid length`));
	return key;
}

/**
 * Check if the shape is impossible and why
 * @param {string} key
 * @returns {string | void}
 */
function checkImpossible(key) {
	let layers = key.split(':');
	const emptyLayer = '--'.repeat(4);
	while (layers[layers.length - 1] == emptyLayer) {
		layers.pop();
	}
	if (layers.length > 4) {
		return `Impossible to stack ${layers.length} layers, max is 4`;
	}
	if (layers.includes(emptyLayer)) {
		return `Impossible to create empty layer #${layers.indexOf(emptyLayer)}`;
	}
	let forms = layers.map(l => {
		return 8 * (l[0] != '-') + 4 * (l[2] != '-') + 2 * (l[4] != '-') + 1 * (l[6] != '-');
	});
	// first, pop layers that can be layered:
	while (forms.length >= 2) {
		if ((forms[forms.length - 1] & forms[forms.length - 2])) {
			forms.pop();
		} else {
			break;
		}
	}
	if (forms.length < 2) {
		return;
	}

	function rotateForm(form) {
		return (form >> 1) + 8 * (form & 1);
	}
	let highestReached = 0;
	for (let j = 0; j < 4; j++) {
		console.log(j, forms.map(e => e.toString(2)));
		// second, check if half has no empty layers and other half is dropped
		let hasNoEmpty = true;
		let l1, l2;
		for (let l1 = 1; l1 < forms.length; l1++) {
			if ((forms[l1] & 3) && !(forms[l1 - 1] & 3)) {
				hasNoEmpty = false;
			}
		}
		let isDropped = true;
		for (let l2 = 1; l2 < forms.length; l2++) {
			if ((forms[l2] & 12) & ~(forms[l2 - 1] & 12)) {
				isDropped = false;
			}
		}
		if (hasNoEmpty && isDropped) {
			console.log('can split in rotation', j);
			break;
		}
		highestReached = Math.max(highestReached, Math.min(l1, l2) - 1);
		forms = forms.map(rotateForm);
		if (j == 3) {
			return `Impossible to create bottom ${highestReached} layers`;
		}
	}
}

/**
 * Check if the key contains uncnown colors and shapes
 * @param {string} key
 * @returns {string | void}
 */
function checkUnknown(key) {
	let badShapes = new Set();
	let badColors = new Set();
	for (let c of key) {
		if (c.match(/[A-Z]/)) {
			if (!enumShortcodeToSubShape[c]) {
				badShapes.add(c);
			}
		}
		if (c.match(/[a-z]/)) {
			if (!enumShortcodeToColor[c]) {
				badColors.add(c);
			}
		}
	}
	const badShapeStr = `Unkown shape${badShapes.size > 1 ? 's' : ''}: <code>${Array.from(badShapes).join(' ')}</code>`;
	const badColorStr = `Unkown color${badShapes.size > 1 ? 's' : ''}: <code>${Array.from(badColors).join(' ')}</code>`;

	if (badShapes.size && badColors.size) {
		return badShapeStr + '<br>' + badColorStr;
	}
	if (badShapes.size) {
		return badShapeStr;
	}
	if (badColors.size) {
		return badColorStr;
	}
}



function renderShape(layers) {
	const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById(
		"result"
	));
	const context = canvas.getContext("2d");

	context.save();
	context.clearRect(0, 0, 1000, 1000);

	const w = 512;
	const h = 512;
	const dpi = 1;
	return internalGenerateShapeBuffer(layers, canvas, context, w, h, dpi);
}

function internalGenerateShapeBuffer(layers, canvas, context, w, h, dpi) {
	context.translate((w * dpi) / 2, (h * dpi) / 2);
	context.scale((dpi * w) / 23, (dpi * h) / 23);

	context.fillStyle = "#e9ecf7";

	const quadrantSize = 10;
	const quadrantHalfSize = quadrantSize / 2;

	context.fillStyle = "rgba(40, 50, 65, 0.1)";
	context.beginCircle(0, 0, quadrantSize * 1.15);
	context.fill();

	for (let layerIndex = 0; layerIndex < layers.length; ++layerIndex) {
		const quadrants = layers[layerIndex];

		const layerScale = Math.max(0.1, 0.9 - layerIndex * 0.22);

		for (let quadrantIndex = 0; quadrantIndex < 4; ++quadrantIndex) {
			if (!quadrants[quadrantIndex]) {
				continue;
			}
			const { subShape, color } = quadrants[quadrantIndex];

			const quadrantPos = arrayQuadrantIndexToOffset[quadrantIndex];
			const centerQuadrantX = quadrantPos.x * quadrantHalfSize;
			const centerQuadrantY = quadrantPos.y * quadrantHalfSize;

			const rotation = radians(quadrantIndex * 90);

			context.translate(centerQuadrantX, centerQuadrantY);
			context.rotate(rotation);

			context.fillStyle = enumColorsToHexCode[color];
			context.strokeStyle = "#555"; // THEME.items.outline;
			context.lineWidth = 1; // THEME.items.outlineWidth;

			const insetPadding = 0.0;

			const dims = quadrantSize * layerScale;
			const innerDims = insetPadding - quadrantHalfSize;
			switch (subShape) {
				case enumSubShape.rect:
					{
						context.beginPath();
						const dims = quadrantSize * layerScale;
						context.rect(
							insetPadding + -quadrantHalfSize,
							-insetPadding + quadrantHalfSize - dims,
							dims,
							dims
						);

						break;
					}
				case enumSubShape.star:
					{
						context.beginPath();
						const dims = quadrantSize * layerScale;

						let originX = insetPadding - quadrantHalfSize;
						let originY = -insetPadding + quadrantHalfSize - dims;

						const moveInwards = dims * 0.4;
						context.moveTo(originX, originY + moveInwards);
						context.lineTo(originX + dims, originY);
						context.lineTo(originX + dims - moveInwards, originY + dims);
						context.lineTo(originX, originY + dims);
						context.closePath();
						break;
					}

				case enumSubShape.windmill:
					{
						context.beginPath();
						const dims = quadrantSize * layerScale;

						let originX = insetPadding - quadrantHalfSize;
						let originY = -insetPadding + quadrantHalfSize - dims;
						const moveInwards = dims * 0.4;
						context.moveTo(originX, originY + moveInwards);
						context.lineTo(originX + dims, originY);
						context.lineTo(originX + dims, originY + dims);
						context.lineTo(originX, originY + dims);
						context.closePath();
						break;
					}

				case enumSubShape.circle:
					{
						context.beginPath();
						context.moveTo(insetPadding + -quadrantHalfSize, -insetPadding + quadrantHalfSize);
						context.arc(
							insetPadding + -quadrantHalfSize,
							-insetPadding + quadrantHalfSize,
							quadrantSize * layerScale,
							-Math.PI * 0.5,
							0
						);
						context.closePath();
						break;
					}

				case enumSubShape.clover:
					{
						context.save();
						context.translate(innerDims, -innerDims);
						context.scale(dims, -dims);
						context.beginPath();

						const inner = 0.5;
						const inner_center = 0.45;

						context.moveTo(0, 0);
						context.lineTo(0, inner);
						context.bezierCurveTo(0, 1, inner, 1, inner_center, inner_center);
						context.bezierCurveTo(1, inner, 1, 0, inner, 0);

						context.closePath();
						context.restore();
						break;
					}
				case enumSubShape.star8:
					{
						context.save();
						context.translate(innerDims, -innerDims);
						context.scale(dims, -dims);
						context.beginPath();

						const inner = 0.5;

						context.moveTo(0, 0);
						context.lineTo(0, inner);
						context.lineTo(Math.sin(Math.PI / 8), Math.cos(Math.PI / 8));
						context.lineTo(inner * Math.sin(Math.PI / 4), inner * Math.cos(Math.PI / 4));
						context.lineTo(Math.sin((Math.PI * 3) / 8), Math.cos((Math.PI * 3) / 8));
						context.lineTo(inner, 0);

						context.closePath();
						context.restore();
						break;
					}
				case enumSubShape.rhombus:
					{
						context.save();
						context.translate(innerDims, -innerDims);
						context.scale(dims, -dims);
						context.beginPath();

						const rad = 0.02;

						// with rounded borders
						context.moveTo(0, 0);
						context.arcTo(0, 1, 1, 0, rad);
						context.arcTo(1, 0, 0, 0, rad);

						context.closePath();
						context.restore();
						break;
					}
				case enumSubShape.plus:
					{
						context.save();
						context.translate(innerDims, -innerDims);
						context.scale(dims, -dims);
						context.beginPath();

						const inner = 0.4;

						context.moveTo(0, 0);
						context.lineTo(1, 0);
						context.lineTo(1, inner);
						context.lineTo(inner, inner);
						context.lineTo(inner, 1);
						context.lineTo(0, 1);

						context.closePath();
						context.restore();
						break;
					}
				case enumSubShape.razor:
					{
						context.save();
						context.translate(innerDims, -innerDims);
						context.scale(dims, -dims);
						context.beginPath();

						const inner = 0.5;

						context.moveTo(0, 0);
						context.lineTo(inner, 0);
						context.bezierCurveTo(inner, 0.3, 1, 0.3, 1, 0);
						context.bezierCurveTo(
							1,
							inner,
							inner * Math.SQRT2 * 0.9,
							inner * Math.SQRT2 * 0.9,
							inner * Math.SQRT1_2,
							inner * Math.SQRT1_2
						);
						context.rotate(Math.PI / 4);
						context.bezierCurveTo(inner, 0.3, 1, 0.3, 1, 0);
						context.bezierCurveTo(
							1,
							inner,
							inner * Math.SQRT2 * 0.9,
							inner * Math.SQRT2 * 0.9,
							inner * Math.SQRT1_2,
							inner * Math.SQRT1_2
						);

						context.closePath();
						context.restore();
						break;
					}
				case enumSubShape.sun:
					{
						context.save();
						context.translate(innerDims, -innerDims);
						context.scale(dims, -dims);
						context.beginPath();

						const inner = 0.4;
						const rad = 0.02;

						const c = 1 / Math.cos(Math.PI / 8);
						const b = c * Math.sin(Math.PI / 8);

						context.moveTo(0, 0);
						context.rotate(Math.PI / 2);
						context.arc(c, 0, b, -Math.PI, -(5 / 8) * Math.PI);
						context.rotate(-Math.PI / 4);
						context.arc(c, 0, b, (-1 - 3 / 8) * Math.PI, (-5 / 8) * Math.PI);
						context.rotate(-Math.PI / 4);
						context.arc(c, 0, b, (5 / 8) * Math.PI, 1 * Math.PI);

						context.closePath();
						context.restore();
						break;
					}
				case enumSubShape.none:
					{
						context.beginPath();
						break;
					}
				default:
					{
						context.save();
						context.translate(innerDims, -innerDims);
						context.scale(dims/8, dims/8);
						context.beginPath();
						context.fillText(subShape || '?', 0, 0);
						context.restore();
					}
			}

			context.fill();
			context.stroke();

			context.rotate(-rotation);
			context.translate(-centerQuadrantX, -centerQuadrantY);
		}


	}

	context.restore();
}

/////////////////////////////////////////////////////

function initVariants() {
	// <ul id="shapeCodes">
	//   <li><code>C</code> Circle</li>
	const ulShapes = document.querySelector('#shapeCodes');
	for (let shape of Object.values(enumSubShape)) {
		let li = document.createElement('li');
		li.innerHTML = `<code>${enumSubShapeToShortcode[shape]}</code> ${shape[0].toUpperCase() + shape.slice(1)}`;
		li.onclick = () => viewShape(enumSubShapeToShortcode[shape]);
		ulShapes.append(li);
	}
	// <ul id="colorCodes">
	//   <li>
	//     <code>r</code>
	//     <span class="colorPreview" style="background: #ff666a;"></span>
	//     Red
	//   </li>
	const ulColors = document.querySelector('#colorCodes');
	for (let color of Object.values(enumColors)) {
		let li = document.createElement('li');
		li.innerHTML = `
    		<code>${enumColorToShortcode[color]}</code>
    		<span class="colorPreview" style="background: ${enumColorsToHexCode[color]};"></span>
    		${color[0].toUpperCase() + color.slice(1)}
    	`;
		li.onclick = () => viewShape(enumSubShapeToShortcode[enumSubShape.circle] + enumColorToShortcode[color]);
		ulColors.append(li);
	}
}

function showError(msg) {
	const errorDiv = document.getElementById("error");
	errorDiv.classList.toggle("hasError", !!msg);
	if (msg) {
		if (errorDiv.innerText == "Shape generated") {
			errorDiv.innerHTML = msg;
		} else {
			errorDiv.innerHTML += '<br>' + msg;
		}
		console.error(msg);
	} else {
		errorDiv.innerText = "Shape generated";
	}
}

// @ts-ignore
window.generate = () => {
	showError(null);
	// @ts-ignore
	const code = document.getElementById("code").value.trim();

	let parsed = null;
	try {
		parsed = fromShortKey(code);
	} catch (ex) {
		showError(ex);
		return;
	}

	renderShape(parsed);
};

// @ts-ignore
window.debounce = (fn) => {
	setTimeout(fn, 0);
};

// @ts-ignore
window.addEventListener("load", () => {
	initVariants();
	if (window.location.search) {
		const key = window.location.search.substr(1);
		document.getElementById("code").value = key;
	}
	generate();
});

window.exportShape = () => {
	const canvas = document.getElementById("result");
	const imageURL = canvas.toDataURL("image/png");

	const dummyLink = document.createElement("a");
	dummyLink.download = "shape.png";
	dummyLink.href = imageURL;
	dummyLink.dataset.downloadurl = [
		"image/png",
		dummyLink.download,
		dummyLink.href,
	].join(":");

	document.body.appendChild(dummyLink);
	dummyLink.click();
	document.body.removeChild(dummyLink);
};

window.viewShape = (key) => {
	document.getElementById("code").value = key;
	generate();
};

window.shareShape = () => {
	const code = document.getElementById("code").value.trim();
	const url = "https://viewer.shapez.io?" + code;
	alert("You can share this url: " + url);
};