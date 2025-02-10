fetch("http://localhost:3000/add_data", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    victimName: "Hermione",
    victimAge: 12,
    victimContact: "4253625635",  
    victimLocation: "MUMBAI",
    victimAccidentdetail:"Accident at this location"
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error("Error:", error));