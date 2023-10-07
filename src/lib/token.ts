export const auth = {
  secret: process.env.SECRET ?? "jsonwebtokensecret",
  options: {
    expiresIn: "7d"
  }
};

export interface ITokenPayload {
  user: {
    id: string
    username: string
    roomIDs: string[]
    createdAt: string
    updatedAt: string
  }
}
