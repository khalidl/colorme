import color from 'color';

/**
 * @param {String} inputColor - A valid hex, rgb, rgba color.
 * @return {Object} An object containing the properties of the given inputColor.
 *                  properties include; rgb, hsl, hwb, alpha, lightness,
 *                  blackness, whiteness.
 */
export const getColorProperties = (inputColor) => {
  const colorObj = color(inputColor);
  const {valpha} = colorObj;
  const {
    r: red,
    g: green,
    b: blue
  } = colorObj.object();

  const {
    h: hue,
    s: saturation,
    l: lightness
  } = colorObj.hsl().object();

  const {
    b: blackness,
    w: whiteness
  } = colorObj.hwb().object();

  const properties = {
    alpha: valpha * 100,
    hue,
    lightness,
    saturation,
    blackness,
    whiteness,
    red,
    green,
    blue
  };

  // Round any floats up on the way out.
  return Object.keys(properties).reduce((prev, curr) => {
    prev[curr] = Math.ceil(properties[curr]);
    return prev;
  }, {});
};

/**
 * @param {String} inputColor - A valid hex, rgb, rgba color.
 * @return {Array} An array of adjuster objects for the inputColor.
 */
export const getAdjustersForColor = (inputColor, baseAdjusters) => {
  const colorProperties = getColorProperties(inputColor);

  return baseAdjusters.map(a => {
    let adjuster = {...a};
    const prop = colorProperties[a.name];

    // FIXME: Holding onto values for enabled adjusters only works for
    // adjusters that use a percentage value. Need to make this smarter
    // or things get all weird.
    if (!adjuster.enabled && prop !== undefined) {
      adjuster.value = prop;
    }

    return adjuster;
  });
};

/**
 * @param {Array} adjusters - An array of adjuster objects.
 * @return {String} A string of space-seprated color adjusters.
 *                  ex; "alpha(100%) hue(250) saturation(50%)"
 */
export const getAdjustersString = (adjusters) => {
  return adjusters.reduce((prev, curr) => {
    const {
      name,
      value,
      unit = ''
    } = curr;

    if (curr.enabled) {
      return `${prev} ${name}(${value}${unit})`;
    }

    return prev;
  }, '');
};

/**
 * @param {String} baseColor - A valid color string
 * @param {String} adjustersStr - A valid color adjusters string
 * @return {String} A CSS color function string or an empty string if no adjusters.
 *                  ex; "color(#ff0004 alpha(100%) hue(250) saturation(50%))"
 */
export const getColorFuncString = (baseColor, adjustersStr = '') => {
  return adjustersStr.length ? `color(${baseColor}${adjustersStr})` : '';
};

/**
 * @param {String} val - A string that looks like a hex, rgb, or rgba color.
 * @return {String} A valid color as a string.
 */
export const getColorFromQueryVal = (val) => {
  const {
    hash,
    search
  } = window.location;

  let baseColor = null;
  const decoded = decodeURIComponent(val.toLowerCase());

  // Assume the user put an non-encoded "#" in the value for a hex color.
  // Browsers will see this as window.location.hash.
  if (decoded.length === 0) {
    if (hash) {
      baseColor = hash;
    }
  // If the val is a valid hex color length, start down that path.
  } else if (decoded.length === 3 || decoded.length === 6) {
    baseColor = decoded.match('#') ? decoded : `#${decoded}`;

    // Now that we've added a '#' to the string, we test to see if this is
    // in fact a valid hex color. If not, let's assume we have a keyword
    // color and remove the "#".
    if (!/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(baseColor)) {
      baseColor = baseColor.replace('#', '');
    }
  // If none of the above match, assume the value is valid as is and just
  // decode it.
  } else {
    baseColor = decoded;
  }

  // One last check. If the baseColor provided is invalid, the call to
  // color() here will throw an error and we fall back to default base.
  try {
    color(baseColor);
  } catch (err) {
    baseColor = null;
    console.warn(`Invalid color provided in URL: ${search}, using default base color.`);
  }

  return baseColor;
};
