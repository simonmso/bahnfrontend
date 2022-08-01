const getAnglesForDate = (date) => ({
  hour: -(Math.PI * (date.getHours() / 6)) + (Math.PI / 2),
  minute: -(Math.PI * (date.getMinutes() / 30)) + (Math.PI / 2),
});

const drawMinuteTicks = (ctx, center, radius) => {
  for (let i = 0; i < 60; i++) {
    const date = new Date(60 * 1000 * i);
    const theta = getAnglesForDate(date).minute;
    const pos = {
      x: center.x + (radius * Math.cos(theta)),
      y: center.y - (radius * Math.sin(theta)),
    };

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 3, 0, 7);
    ctx.fill();
  }
};

// const drawHourTicks = (ctx, center, radius) => {
//   for (let i = 0; i < 12; i++) {
//     const date = new Date(60 * 1000 * 60 * i);
//     console.log("date", date.getUTCHours());
//     const theta = getAnglesForDate(date).hour;
//     const pos = {
//       x: center.x + (radius * Math.cos(theta)),
//       y: center.y - (radius * Math.sin(theta)),
//     };

//     ctx.fillStyle = "white";
//     ctx.fillRect(pos.x - 4, pos.y - 4, 8, 8);
//   }
// };

const main = () => {
  const canvas = document.getElementById("main");

  const width = window.innerWidth - 17;
  const height = window.innerHeight - 4;
  const center = { x: width / 2, y: height / 2 };
  const radius = height / 3;

  canvas.height = height;
  canvas.width = width;

  const ctx = canvas.getContext("2d");

  drawMinuteTicks(ctx, center, radius);
  // drawHourTicks(ctx, center, radius);
};

export default main;
