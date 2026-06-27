console.log("Environment variables:");
for (const key of Object.keys(process.env)) {
  // Do not print sensitive values fully, but print if they exist and their length
  const val = process.env[key] || "";
  if (key.includes("KEY") || key.includes("SECRET") || key.includes("PASSWORD") || key.includes("CREDENTIALS") || key.includes("TOKEN") || key.includes("AUTH")) {
    console.log(`${key}: [EXISTS, length=${val.length}]`);
  } else {
    console.log(`${key}: ${val}`);
  }
}
