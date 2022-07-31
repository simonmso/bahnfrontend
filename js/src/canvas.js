// test this
const getAnglesForDate = (date) => ({
  hour: (Math.PI / 4) - ((Math.PI / 6) * (date.getHours())),
  minute: (Math.PI / 4) - ((Math.PI / 6) * (date.getMinutes() / 60)),
});

// WORKING ON:
const drawMinuteTicks

const main = () => {
  const canvas = document.getElementById("main");

  const width = window.innerWidth - 17;
  const height = window.innerHeight - 4;
  const center = { x: width / 2, y: height / 2 };
  const radius = height / 4;

  canvas.height = height;
  canvas.width = width;

  const ctx = canvas.getContext("2d");

  ctx.strokeStyle = "white";

  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, 7);
  ctx.stroke();
};

main();
