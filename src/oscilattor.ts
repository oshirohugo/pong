// totally copied from https://riptutorial.com/javascript/example/10173/periodic-functions-using-math-sin
export default function oscillator(
  time: number,
  frequency = 1,
  amplitude = 1,
  phase = 0,
  offset = 0,
) {
  let t = time * frequency * Math.PI * 2; // get phase at time
  t += phase * Math.PI * 2; // add the phase offset
  let v = Math.sin(t); // get the value at the calculated position in the cycle
  v *= amplitude; // set the amplitude
  v += offset; // add the offset
  return v;
}
