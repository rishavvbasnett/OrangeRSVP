import axios from "axios";
import type { Credential, LoggedUser } from "../auth.types.ts";
import { CredentialSchema } from "../auth.schema.ts";

const url = "http://localhost:3001/login/";

const login = async (credential: Credential): Promise<LoggedUser> => {
  const validCredential = CredentialSchema.parse(credential);
  const response = await axios.post(url, validCredential);
  return response.data;
};

const loginApi = {
  login,
};

export default loginApi;
