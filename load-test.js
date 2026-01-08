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
      productId: "1abf9e20-eda6-4a8b-b919-1169db28b78b",
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
