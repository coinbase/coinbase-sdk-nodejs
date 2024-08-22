const express = require('express');
const app = express();

app.use(express.json());

app.post('/callback', (req, res) => {
    const data = req.body;
    console.log(JSON.stringify(data, null, 4));
    const response = {
        message: 'Data received',
        received_data: data
    };
    res.json(response);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
