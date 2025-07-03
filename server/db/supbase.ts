import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config()

const supabaseKey = process.env.SUPABASE_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;

if (!supabaseUrl) throw new Error(`not a valid url : ${supabaseUrl}`);
if (!supabaseKey) throw new Error("Not valid key");

export const client = () => {
  return createClient(supabaseUrl, supabaseKey);
};
