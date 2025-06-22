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
          {!adminLogado && (
            <Button
              color="primary"
              variant="text"
              size="small"
              sx={{ ml: 1, fontWeight: 'bold', px: 2, minWidth: 0 }}
              onClick={() => onSelect('admin')}
            >
              Painel Administrador
            </Button>
          )}
          {adminLogado && (
            <Button
              color="error"
              variant="contained"
              size="small"
              sx={{ ml: 2, fontWeight: 'bold', px: 2, minWidth: 0 }}
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
