import React, { useEffect, useState } from "react";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Badge } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BlockIcon from "@mui/icons-material/Block";

const menuItems = [
  { label: "Dashboard", icon: <DashboardIcon />, value: "dashboard" },
  { label: "Cobranças", icon: <MonetizationOnIcon />, value: "cobrancas" },
  { label: "Atrasados", icon: <AccessTimeIcon />, value: "atrasados" },
  { label: "Lista Negra", value: "inadimplentes", icon: <BlockIcon /> },
];

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Sidebar({ selected, onSelect, onPainel }) {
  const [qtdCobrancas, setQtdCobrancas] = useState(0);
  const [qtdAtrasados, setQtdAtrasados] = useState(0);
  const [qtdInadimplentes, setQtdInadimplentes] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/emprestimos/cobrancas-hoje`)
      .then(res => res.json())
      .then(data => setQtdCobrancas(Array.isArray(data) ? data.length : 0))
      .catch(() => setQtdCobrancas(0));

    fetch(`${API_URL}/api/emprestimos/atrasados`)
      .then(res => res.json())
      .then(data => setQtdAtrasados(Array.isArray(data) ? data.length : 0))
      .catch(() => setQtdAtrasados(0));

    fetch(`${API_URL}/api/emprestimos/inadimplentes`)
      .then(res => res.json())
      .then(data => setQtdInadimplentes(Array.isArray(data) ? data.length : 0))
      .catch(() => setQtdInadimplentes(0));
  }, []);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 220,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 220, boxSizing: 'border-box', background: "#f5f6fa" },
      }}
    >
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.value} disablePadding>
            <ListItemButton
              selected={selected === item.value}
              onClick={
                item.value === "dashboard"
                  ? onPainel
                  : () => onSelect(item.value)
              }
            >
              <ListItemIcon>
                {item.value === "cobrancas" ? (
                  <Badge badgeContent={qtdCobrancas} color="primary">
                    {item.icon}
                  </Badge>
                ) : item.value === "atrasados" ? (
                  <Badge badgeContent={qtdAtrasados} color="error">
                    {item.icon}
                  </Badge>
                ) : item.value === "inadimplentes" ? (
                  <Badge badgeContent={qtdInadimplentes} color="secondary">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
