import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

function Navbar({ onSelect, adminLogado, onLogout }) {
  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        minHeight: 40,
        height: 40,
        justifyContent: 'center'
      }}
    >
      <Toolbar sx={{ minHeight: 40, height: 40, px: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', fontSize: 15 }}>
          HB Crédito Rápido
        </Typography>
        <Box>
          {!adminLogado && (
            <Button
              color="primary"
              variant="outlined"
              size="small"
              sx={{
                ml: 1,
                fontWeight: 'bold',
                px: 1,
                fontSize: 12,
                minWidth: 70,
                height: 28,
                lineHeight: 1
              }}
              onClick={() => onSelect('admin')}
            >
              Painel
            </Button>
          )}
          {adminLogado && (
            <Button
              color="error"
              variant="contained"
              size="small"
              sx={{
                ml: 2,
                fontWeight: 'bold',
                px: 1,
                fontSize: 12,
                minWidth: 60,
                height: 28,
                lineHeight: 1
              }}
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
