import { schema } from "../graphql/schema/index";

// This will trigger the schema generation
console.log("Schema generated successfully");
console.log("Types:", Object.keys(schema.getTypeMap()).length);
