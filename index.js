const fs = require("fs/promises");

(async () => {
  // Command definitions
  const CREATE_BUTTON = "create button";
  const DELETE_BUTTON = "delete button";

  const indexPath = "./index.html"; // HTML file path

  // Arrays of allowed names and colors
  const buttonNames = ["btnRed", "btnBlue", "btnGreen", "btnYellow", "btnPurple", "btnOrange", "btnCyan", "btnPink", "btnSkyBlue", "btnLimeGreen"];
  const buttonColors = ["red", "blue", "green", "yellow", "purple", "#FF5733", "#33FFCE", "#FF33A1", "#3380FF", "#4CAF50"];

  // Track used button names to prevent duplicates
  const usedNames = new Set();

  // Initialize HTML file if it doesn't exist
  const initializeHTMLFile = async () => {
    try {
      await fs.access(indexPath);
    } catch (e) {
      const initialContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dynamic HTML Elements</title>
  <style>
    /* Static styles */
    body { font-family: Arial, sans-serif; margin: 20px; }
    button { color: white; padding: 12px 24px; font-size: 16px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
  </style>
</head>
<body>
</body>
</html>`;
      await fs.writeFile(indexPath, initialContent, "utf-8");
    }
  };

  // Function to add a new button with specified name-based ID and background color
  const appendButtonToHTML = async (nameId, color) => {
    // Check if the name is valid and hasn't been used
    if (!buttonNames.includes(nameId)) {
      console.log(`Name "${nameId}" is not allowed. Choose from predefined names.`);
      return;
    }
    if (usedNames.has(nameId)) {
      console.log(`Button with name ID "${nameId}" already exists.`);
      return;
    }

    // Check if the color is valid
    if (!buttonColors.includes(color)) {
      console.log(`Color "${color}" is not allowed. Choose from predefined colors.`);
      return;
    }

    // Create the button with the specified ID and color
    const buttonHTML = `<button id="${nameId}" style="background-color: ${color};">Button ${nameId}</button>`;
    const html = await fs.readFile(indexPath, "utf-8");

    // Append the button HTML to the file
    const updatedHTML = html.replace("</body>", `${buttonHTML}\n</body>`);
    await fs.writeFile(indexPath, updatedHTML, "utf-8");

    usedNames.add(nameId); // Mark this name as used
    console.log(`Button with name ID "${nameId}" and color "${color}" added to ${indexPath}`);
  };

  // Function to delete a button by its name-based ID
  const deleteButtonFromHTML = async (nameId) => {
    const html = await fs.readFile(indexPath, "utf-8");
    const buttonHTML = new RegExp(`<button id="${nameId}".*?</button>\\s*`, "g");
    const updatedHTML = html.replace(buttonHTML, "");

    if (updatedHTML !== html) {
      await fs.writeFile(indexPath, updatedHTML, "utf-8");
      usedNames.delete(nameId); // Remove from the set of used names
      console.log(`Button with name ID "${nameId}" removed from ${indexPath}`);
    } else {
      console.log(`Button with name ID "${nameId}" not found in the HTML file.`);
    }
  };

  // Monitor and execute commands from command.txt
  await initializeHTMLFile();
  const commandFileHandler = await fs.open("./command.txt", "r");
  const watcher = fs.watch("./command.txt");

  commandFileHandler.on("change", async () => {
    const size = (await commandFileHandler.stat()).size;
    const buff = Buffer.alloc(size);
    await commandFileHandler.read(buff, 0, size, 0);
    const command = buff.toString("utf-8").trim();

    // Command execution
    if (command.startsWith(CREATE_BUTTON)) {
      const parts = command.split(" ");
      const nameId = parts[2]; // Extract the desired name ID
      const color = parts[3]; // Extract the desired color
      if (nameId && color) {
        await appendButtonToHTML(nameId, color);
      } else {
        console.log("Specify a name and color to create (e.g., 'create button btnRed red').");
      }
    } else if (command.startsWith(DELETE_BUTTON)) {
      const nameId = command.split(" ")[2]; // Extract the name ID
      if (nameId) {
        await deleteButtonFromHTML(nameId);
      } else {
        console.log("Specify a name ID to delete (e.g., 'delete button btnRed').");
      }
    }
  });

  // Trigger file change on command.txt updates
  for await (const event of watcher) {
    if (event.eventType === "change") {
      commandFileHandler.emit("change");
    }
  }
})();
