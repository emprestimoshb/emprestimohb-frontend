import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminLogin({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha })
      });
      const data = await response.json();
      if (response.ok && data.sucesso) {
        onLogin();
      } else {
        setErro(data.mensagem || 'Usuário ou senha inválidos');
      }
    } catch (err) {
      setErro('Erro ao conectar ao servidor');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={4} sx={{ p: 4, maxWidth: 350, width: '100%', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <LockOutlinedIcon sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            Login Administrador
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Usuário"
            variant="outlined"
            fullWidth
            margin="normal"
            value={usuario}
            onChange={e => setUsuario(e.target.value)}
            required
          />
          <TextField
            label="Senha"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, fontWeight: 'bold' }}
          >
            Entrar
          </Button>
        </form>
        {erro && <Alert severity="error" sx={{ mt: 2 }}>{erro}</Alert>}
      </Paper>
    </Box>
  );
}

export default AdminLogin;
