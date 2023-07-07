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

const App = ({ signOut }) => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, []);

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
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
};

export default withAuthenticator(App);