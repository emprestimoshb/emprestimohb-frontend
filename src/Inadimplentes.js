import React, { useEffect, useState } from "react";
import {
  Box, Typography, Grid, Button, Card, CardContent, CardActions,
  Menu, MenuItem, Divider, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Inadimplentes({ onVoltar }) {
  const [inadimplentes, setInadimplentes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [acaoId, setAcaoId] = useState(null);

  // Estados para o desconto
  const [openDesconto, setOpenDesconto] = useState(false);
  const [descontoValor, setDescontoValor] = useState('');
  const [itemDesconto, setItemDesconto] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/emprestimos/inadimplentes`)
      .then(res => res.json())
      .then(data => {
        setInadimplentes(data);
        setCarregando(false);
      });
  }, []);

  // Marcar como quitado
  const marcarComoQuitado = async (id) => {
    try {
      await fetch(`${API_URL}/api/emprestimos/${id}/fluxo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status_fluxo: "Quitado",
          pagamento_total: true,
          data_pagamento_real: new Date().toISOString().slice(0, 10)
        })
      });
      setInadimplentes(inadimplentes => inadimplentes.filter(e => e.id !== id));
    } catch (err) {
      alert('Erro ao marcar como quitado.');
    }
  };

  // Marcar pagamento dos 30%
  const marcarPagamento30 = async (item) => {
    try {
      const novaDataPagamento = new Date();
      novaDataPagamento.setDate(novaDataPagamento.getDate() + 30);

      await fetch(`${API_URL}/api/emprestimos/${item.id}/fluxo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagamento_30: true,
          quantidade_pagamento_30: (item.quantidade_pagamento_30 || 0) + 1,
          data_ultimo_pagamento_30: new Date().toISOString().slice(0, 10),
          status_fluxo: "Prorrogado",
          data_pagamento: novaDataPagamento.toISOString().slice(0, 10)
        })
      });
      setInadimplentes(inadimplentes => inadimplentes.filter(e => e.id !== item.id));
    } catch (err) {
      alert('Erro ao marcar pagamento dos 30%.');
    }
  };

  const handleAcoes = (event, id) => {
    setAnchorEl(event.currentTarget);
    setAcaoId(id);
  };

  const marcarAcao = (acao) => {
    const item = inadimplentes.find(e => e.id === acaoId);
    if (!item) return;
    if (acao === "Quitado") marcarComoQuitado(item.id);
    if (acao === "Pagou só os juros") marcarPagamento30(item);
    setAnchorEl(null);
    setAcaoId(null);
  };

  // Função para abrir o modal de desconto
  const abrirDesconto = (item) => {
    setItemDesconto(item);
    setDescontoValor(item.juros_atraso ? Number(item.juros_atraso).toFixed(2) : '');
    setOpenDesconto(true);
  };

  // Função para aplicar o desconto
  const aplicarDesconto = async () => {
    if (!itemDesconto || descontoValor === '') return;
    try {
      await fetch(`${API_URL}/api/emprestimos/${itemDesconto.id}/fluxo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          juros_atraso: Number(descontoValor),
          valor_total_devido: (Number(itemDesconto.valor_desejado) * 1.3) + Number(descontoValor)
        })
      });
      // Agora, busque novamente do backend para garantir dados atualizados:
      const res = await fetch(`${API_URL}/api/emprestimos/inadimplentes`);
      const data = await res.json();
      setInadimplentes(data);
      setOpenDesconto(false);
    } catch (err) {
      alert('Erro ao aplicar desconto.');
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Lista Negra (Inadimplentes)
      </Typography>
      <Button variant="outlined" onClick={onVoltar} sx={{ mb: 2 }}>
        Voltar
      </Button>
      {carregando ? (
        <Typography>Carregando...</Typography>
      ) : inadimplentes.length === 0 ? (
        <Typography>Nenhum cliente inadimplente.</Typography>
      ) : (
        <Grid container spacing={3}>
          {inadimplentes.map((item) => {
            const valorDesejado = Number(item.valor_desejado);
            const valorTotal = valorDesejado + (valorDesejado * 0.3);
            const jurosAtraso = Number(item.juros_atraso) || 0;
            const valorTotalDevido = Number(item.valor_total_devido) || (valorTotal + jurosAtraso);

            return (
              <Grid item xs={12} md={6} key={item.id}>
                <Card sx={{ borderRadius: 3, boxShadow: 3, bgcolor: "#fffbea" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <PersonIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {item.nome || "Nome não disponível"}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <b>ID Cliente:</b> {item.id_cliente} &nbsp; | &nbsp; <b>CPF:</b> {item.cpf}
                    </Typography>
                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ mb: 1 }}>
                      <Chip label="Inadimplente" color="error" sx={{ fontWeight: "bold" }} />
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <b>Venceu em:</b> {new Date(item.data_pagamento).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <b>Data do Empréstimo:</b> {new Date(item.data_emprestimo).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <MonetizationOnIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <b>Valor investido:</b> R$ {Number(item.valor_desejado).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <MonetizationOnIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <b>Valor total a receber:</b> R$ {(Number(item.valor_desejado) * 1.3).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <b>Dias em atraso:</b> {item.dias_atraso}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <MonetizationOnIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <b>Juros de atraso:</b> R$ {jurosAtraso.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <MonetizationOnIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="error" sx={{ fontWeight: "bold" }}>
                        <b>Valor Total Devido:</b> R$ {Number(item.valor_total_devido).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                  </CardContent>
                  <CardActions sx={{ justifyContent: "flex-end", pb: 2, pr: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<WhatsAppIcon sx={{ color: "#fff" }} />}
                      sx={{
                        backgroundColor: "#25D366",
                        color: "#fff",
                        '&:hover': { backgroundColor: "#1ebe57" }
                      }}
                      onClick={() => {
                        const numero = (item.telefone || '').replace(/\D/g, '');
                        if (numero) {
                          window.open(`https://wa.me/55${numero}`, '_blank');
                        } else {
                          alert('Telefone não disponível para WhatsApp.');
                        }
                      }}
                    >
                      Notificar
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={(e) => { handleAcoes(e, item.id); setItemDesconto(item); }}
                    >
                      Ações
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Menu de ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => marcarAcao("Quitado")}>Marcar como Quitado</MenuItem>
        <MenuItem onClick={() => marcarAcao("Pagou só os juros")}>Pagou só os juros</MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); abrirDesconto(itemDesconto); }}>Aplicar desconto</MenuItem>
      </Menu>

      {/* Dialog para aplicar desconto */}
      <Dialog open={openDesconto} onClose={() => setOpenDesconto(false)}>
        <DialogTitle>Aplicar desconto nos juros de atraso</DialogTitle>
        <DialogContent>
          <TextField
            label="Novo valor dos juros de atraso (R$)"
            type="number"
            value={descontoValor}
            onChange={e => setDescontoValor(e.target.value)}
            fullWidth
            autoFocus
            inputProps={{ min: 0, step: "0.01" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDesconto(false)}>Cancelar</Button>
          <Button
            onClick={aplicarDesconto}
            variant="contained"
            color="primary"
            disabled={descontoValor === ''}
          >
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
