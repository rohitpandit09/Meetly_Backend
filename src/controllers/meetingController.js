const Meeting = require("../models/Meeting");

// generate random meeting code
const generateCode = () => {
  return Math.random().toString(36).substring(2,8);
};

exports.createMeeting = async (req,res)=>{

  try{

    const { name, description, hostId } = req.body;

    const meetingCode = generateCode();

    const meeting = new Meeting({
      className: name,
      description: description,
      meetingCode: meetingCode,
      host: hostId
    });

    await meeting.save();

    res.json({
      message:"Meeting created successfully",
      meetingCode,
      meetingLink:`http://localhost:5173/class/${meetingCode}`
    });

  }catch(error){

    res.status(500).json({
      error:error.message
    });

  }

};

exports.getMeeting = async (req,res)=>{

  try{

    const meeting = await Meeting.findOne({
      meetingCode:req.params.meetingCode
    });

    if(!meeting){
      return res.status(404).json({
        message:"Meeting not found"
      });
    }

    res.json(meeting);

  }catch(error){

    res.status(500).json({
      error:error.message
    });

  }

};

exports.startMeeting = async (req, res) => {
  try {

    const { meetingCode } = req.body; 

    const meeting = await Meeting.findOneAndUpdate(
      { meetingCode },
      { isLive: true },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json({
      message: "Meeting started",
      meeting
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { meetingCode, message } = req.body;

    const meeting = await Meeting.findOne({ meetingCode });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    meeting.messages.push(message);

    await meeting.save();

    res.json({ message: "Message saved" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};