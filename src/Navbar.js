import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

function Navbar({ onSelect, adminLogado, onLogout }) {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          HB Crédito Rápido
        </Typography>
        <Box>
          <Button
            color="inherit"
            variant="outlined"
            sx={{ ml: 1, bgcolor: '#fff', color: '#1976d2', fontWeight: 'bold' }}
            onClick={() => onSelect('formulario')}
          >
            Formulário
          </Button>
          {!adminLogado && (
            <Button
              color="inherit"
              variant="outlined"
              sx={{ ml: 1, bgcolor: '#fff', color: '#1976d2', fontWeight: 'bold' }}
              onClick={() => onSelect('admin')}
            >
              Painel Administrador
            </Button>
          )}
          {adminLogado && (
            <Button
              color="error"
              variant="contained"
              sx={{ ml: 2, fontWeight: 'bold' }}
              onClick={onLogout}
            >
              Sair
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;