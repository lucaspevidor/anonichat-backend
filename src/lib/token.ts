export const auth = {
  secret: process.env.SECRET ?? "jsonwebtokensecret",
  options: {
    expiresIn: "7d"
  }
};
