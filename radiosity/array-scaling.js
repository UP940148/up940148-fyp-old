const precision = 0;
/*
export function shrink(subject, round = true) {
  if (!round) {
    precision = 0;
    scale = 0;
  }
  // Compress array
  const result = [];

  let i = 0;
  while (i < subject.length) {
    let count = 1;
    const entry = [count, subject[i]];
    let next = subject[i + 1];
    // If value is being rounded, then round

    if (entry[1]) {
      entry[1] = Number((entry[1] * Math.pow(10, scale)).toFixed(precision));
    }
    if (next) {
      next = Number((next * Math.pow(10, scale)).toFixed(precision));
    }


    // If value is same as next, then collect values into a smaller entry
    while (entry[1] === next) {
      // Count total number of entries that are equal
      entry[0] = count;

      next = subject[i + 1];

      if (next) {
        next = Number((next * Math.pow(10, scale)).toFixed(precision));
      }

      if (entry[1] === next) {
        count++;
        i++;
      }
    }

    if (Array.isArray(entry) && entry[0] < 3) {
      let j = 0;
      while (j < entry[0]) {
        result.push(entry[1]);
        j++;
      }
    } else {
      result.push(entry);
    }


    i++;
  }

  return result;
}
*/

export function shrink(subject, round = true) {
  // Compress array
  const result = [];

  let i = 0;
  while (i < subject.length) {
    let count = 1;
    const entry = [count, subject[i]];
    let next = subject[i + 1];
    // If value is being rounded, then round

    if (entry[1]) {
      entry[1] = round ? roundBetween(entry[1], 1e-9, 0) : entry[1];
    }
    if (next) {
      next = round ? roundBetween(next, 1e-9, 0) : next;
    }


    // If value is same as next, then collect values into a smaller entry
    while (entry[1] === next) {
      // Count total number of entries that are equal
      entry[0] = count;

      next = subject[i + 1];

      if (next) {
        next = round ? roundBetween(next, 1e-9, 0) : next;
      }

      if (entry[1] === next) {
        count++;
        i++;
      }
    }

    if (Array.isArray(entry) && entry[0] < 3) {
      let j = 0;
      while (j < entry[0]) {
        result.push(entry[1]);
        j++;
      }
    } else {
      result.push(entry);
    }


    i++;
  }

  return result;
}

export function expand(subject) {
  const result = [];

  let i = 0;
  while (i < subject.length) {
    if (Array.isArray(subject[i])) {
      let j = 0;
      while (j < subject[i][0]) {
        result.push(subject[i][1]);
        j++;
      }
    } else {
      result.push(subject[i]);
    }
    i++;
  }
  return result;
}

function roundBetween(value, ceil, floor) {
  // If number isn't between the values, return the number
  if (value > ceil || value < floor) {
    return Number(value.toExponential(precision));
  }

  // Get closest value
  const vc = Math.abs(value - ceil);
  const vf = Math.abs(value - floor);

  return vc <= vf ? ceil : floor;
}
