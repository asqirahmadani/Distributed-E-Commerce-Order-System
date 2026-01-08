import autocannon from "autocannon";

const instance = autocannon(
  {
    url: "http://localhost:3000/api/orders",
    connections: 5,
    duration: 5,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId: "2aa524b2-c6f7-40da-9a57-cd33f2f0e919",
      quantity: 1,
    }),
  },
  (err, result) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Finished:", result);
    }
  }
);

autocannon.track(instance);
