import { config } from "dotenv";
import { executeGymCrudOperations } from "./gymCrud.js";

config();
console.log("DB_URI:", process.env.DB_URI);

await executeGymCrudOperations().catch(error => {
    console.error('Error during gym CRUD operations:', error);
});
