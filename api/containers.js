import fetch from "node-fetch";

// GitHub details
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;  // Use environment variable for security
const REPO_OWNER = "your_github_username";
const REPO_NAME = "your_repo_name";
const FILE_PATH = "containers.json";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { originalNumber, newContainerNumber, locatie } = req.body;

    // Validate required fields
    if (!originalNumber || originalNumber.length !== 11 || !locatie) {
      return res.status(400).json({ error: "Invalid data" });
    }

    // Create new container object
    const newContainer = {
      originalNumber,
      newContainerNumber: newContainerNumber || null,
      locatie,
      datum: new Date().toISOString(),
    };

    try {
      // Fetch the current JSON file from GitHub
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
      });
      const fileData = await response.json();

      // Decode and parse existing data
      const currentData = JSON.parse(
        Buffer.from(fileData.content, "base64").toString()
      );

      // Add the new container
      currentData.push(newContainer);

      // Encode updated JSON
      const updatedContent = Buffer.from(JSON.stringify(currentData, null, 2)).toString("base64");

      // Commit the updated JSON back to GitHub
      const result = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Add new container",
          content: updatedContent,
          sha: fileData.sha,
        }),
      });

      if (!result.ok) {
        throw new Error("Failed to update JSON on GitHub");
      }

      res.status(200).json({ message: "Container added successfully!" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
