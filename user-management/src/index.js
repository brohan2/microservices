import express from 'express';

const app = express();

app.get('/', (req, res) => {  
    res.send('User Management Service is running');
});

app.listen(3000, () => {  
    console.log('User Management Service is listening on port 3000');
});