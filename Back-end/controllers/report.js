const fs=require('fs');
const path=require('path');
const reports=require('../models/report');

async function handleLoginDetails(req,res){
    const { childName, sessionId } = req.body;
    try {
        await reports.create({
            childname: childName,
            sessionid: sessionId
        });
        res.status(200).json({ message: 'Login details saved successfully' });
    } catch (error) {
        console.error("Error saving data:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function handleUploading(req, res) {
    const { image, filename, childName, sessionId } = req.body;

    // Ensure all required fields are provided
    if (!image || !filename || !childName || !sessionId) {
        return res.status(400).json({ error: 'Missing required fields: image, filename, childName, or sessionId' });
    }

    // Define the absolute path for the photos directory (outside the controllers directory)
    const imagesDirectory = path.join(__dirname, '..', 'photos');
    if (!fs.existsSync(imagesDirectory)) {
        fs.mkdirSync(imagesDirectory, { recursive: true });
    }

    const childDirectory = path.join(imagesDirectory, childName);
    const sessionDirectory = path.join(childDirectory, sessionId);

    // Create directories if they don’t exist
    if (!fs.existsSync(childDirectory)) {
        fs.mkdirSync(childDirectory, { recursive: true });
    }
    if (!fs.existsSync(sessionDirectory)) {
        fs.mkdirSync(sessionDirectory, { recursive: true });
    }

    // Decode base64 image and save it
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const filePath = path.join(sessionDirectory, filename);

    try {
        // Save the file
        fs.writeFileSync(filePath, base64Data, 'base64');

        // Add only the image path to the `images` array
        const imagePathObject = { imgpath: path.join('photos', childName, sessionId, filename) }; // Relative path

        // Find the document by childName and sessionId, and update the images array
        await reports.findOneAndUpdate(
            { childname: childName, sessionid: sessionId }, // Find by childName and sessionId
            { $push: { images: imagePathObject } },          // Push the new image path to the images array
            { new: true, upsert: true }                      // Create a new document if it doesn't exist
        );

        // Respond to the client only once
        res.json({ success: true, message: 'Image saved and path updated successfully' });
    } catch (error) {
        console.error("Error saving image or updating database:", error);
        res.status(500).json({ error: 'Error saving image or updating database' });
    }
}

async function handleReport(req, res) {
    try {
        // Fetch only childname and sessionid fields
        const report = await reports.find({}, 'childname sessionid');
        if (!report || report.length === 0) {
            return res.status(404).json({ error: "No reports found." });
        }
        res.status(200).json(report); // Send the filtered data as JSON response
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


async function handleModel(req, res) {
  const body = req.body;
  const { childname, sessionid } = body;

  // Construct the folder path based on your directory structure
  const baseFolderPath = path.join(__dirname, '..', '..', 'Back-end');  // Adjust if necessary
  const photosFolderPath = path.join(baseFolderPath, 'photos', childname, sessionid);

  console.log("Photos Folder Path:", photosFolderPath);

  // Check if the photos folder exists
  fs.readdir(photosFolderPath, (err, files) => {
    if (err) {
      // Error if the folder doesn't exist or there's an issue reading it
      console.error("Error reading folder:", err);
      return res.status(500).json({ message: "Error reading folder." });
    }

    // You can process the files here. For example, filter out specific files if needed.
    console.log("Files in photos folder:", files);

    // Process or analyze the files as needed
    res.status(200).json({ message: "Folder processed successfully.", files });
  });
}


module.exports={
    handleLoginDetails,
    handleUploading,
    handleReport,
    handleModel
}