import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import { ExportReactCSV } from './ExportReactCSV'
import { API } from "aws-amplify";
import {
  Button,
  Flex,
  Heading,
  Text,
  TextField,
  View,
  withAuthenticator,
} from "@aws-amplify/ui-react";
import { listNotes } from "./graphql/queries";
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
} from "./graphql/mutations";
import Table from 'react-bootstrap/Table';
import { Configuration, OpenAIApi } from "openai";

const App = ({ signOut }) => {
  const [notes, setNotes] = useState([]);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const key = process.env.REACT_APP_SECRET_API_KEY;

  useEffect(() => {
    fetchNotes();
  }, []);
    
  const sendMessage = async () => {
    document.getElementById('chatResponse').textContent = "Typing";
    
    var text = "I am applying as a Software Engineer intern for Summer of 2024,"
    + "what companies do you recommend I look at? I have already applied to these companies: ";
    {notes.map((note, index) => (
      text += note.name
    ))}
    setMessage(text);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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', 
        },
        body: JSON.stringify({
          "model": "gpt-3.5-turbo",
          "messages": [
            {"role": "system", "content": "You are helping me find new software intern opportunities for the summer of 2024."}, 
            {"role": "user", "content": text}
          ]
        })  
      });

      const data = await response.json();
      setResponse(data.choices[0].message['content']);
      document.getElementById('chatResponse').textContent = data.choices[0].message['content'];
      
    } catch (error) {
      if (error.message == '429') {
        // If a rate limit error occurred, wait 1 second before retrying
        setTimeout(sendMessage, 1000);
      } else {
          console.error('Error:', error);
          document.getElementById('chatResponse').textContent = "Error connecting to OpenAI";
      }
    }
  };

  async function fetchNotes() {
    try{
      const apiData = await API.graphql({ query: listNotes });
      const notesFromAPI = apiData.data.listNotes.items;
      setNotes(notesFromAPI);
    }catch(error){
      console.error('An error occurred:', error);
    }
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const data = {
      name: form.get("name"),
      description: form.get("description"),
      status: form.get("selectList"),
      date: new Date().toJSON().slice(0, 10),
    };
    try {
      await API.graphql({
        query: createNoteMutation,
        variables: { input: data },
      });
      fetchNotes();
      event.target.reset();
    } catch (error) {
        console.error('An error occurred:', error);
        // handle the error appropriately for your application
    }
  }

  async function deleteNote({ id }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }
  const applicationRow = (note,index) => {

    if(note.status == 'Waiting'){
      var color = "yellow"
    }else if(note.status == 'Denied'){
      var color = "Red"
    }else{
      var color = "green"
    }
    return(
          <tr key = {index} className='even' bgcolor={color}>
              <td> {index + 1} </td>
              <td>{note.name}</td>
              <td>{note.description}</td>
              <td>{note.date}</td>
              <td >{note.status}</td>
              <td>
              <Button variation="link" onClick={() => deleteNote(note)}>
                Delete Application
              </Button>
              </td>
          </tr>
      )
  }
  var index = 0;

  return (
    <View className="App">
      <Heading level={1}>Job Application Tracker</Heading>
      <View as="form" margin="3rem 0" onSubmit={createNote}>
        <Flex direction="row" justifyContent="center">
          <TextField
            name="name"
            placeholder="Company Name"
            label="Note Name"
            labelHidden
            variation="quiet"
            required
          />
          <TextField
            name="description"
            placeholder="Position"
            label="Note Description"
            labelHidden
            variation="quiet"
            required
          />
          <select name="selectList" id="selectList"> 
           <option value="Waiting">Waiting</option>
           <option value="Interview Stage">Interview Stage</option>
           <option value="Denied">Denied</option>
          </select>
          <Button type="submit" variation="primary">
            Add Application
          </Button>
          <div>
              <ExportReactCSV csvData={notes} fileName="Applications" />
          </div>
          <Button variation="link" onClick={sendMessage}>
            ChatGPT Job Recommendations
          </Button>
        </Flex>
      </View>
      <Heading level={2}>Current Applications</Heading>
      <Table striped bordered hover>      
        <thead className='bgvi'>
          <tr>
            <th>#</th>
            <th>Company Name</th>
            <th>Position</th>
            <th>Date Applied</th>
            <th>Status</th>
            <th>Delete Application</th>
          </tr>
        </thead>
        
          {notes.map((note, index) => (
            applicationRow(note, index)
          ))}
        
      </Table>
      <div className="chatResponse" id = "chatResponse">
        Chat Bot Response
      </div>
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
};

export default withAuthenticator(App);