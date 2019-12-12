async function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

module.exports = {
  sleep,
}