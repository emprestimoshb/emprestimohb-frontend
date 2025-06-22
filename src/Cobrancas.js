import React, { useEffect, useState } from "react";
import {
  Box, Typography, Grid, Button, Card, CardContent, CardActions,
  Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Chip
} from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

export default function Cobrancas({ onVoltar }) {
  const [cobrancas, setCobrancas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [contatoOpen, setContatoOpen] = useState(false);
  const [contatos, setContatos] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [acaoId, setAcaoId] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/emprestimos/cobrancas-hoje")
      .then(res => res.json())
      .then(data => {
        setCobrancas(data);
        setCarregando(false);
      });
  }, []);

  // Função para buscar contatos do cliente
  const handleContatos = async (cpf) => {
    const res = await fetch(`http://localhost:5000/api/cadastros/${cpf}`);
    const data = await res.json();
    setContatos(data.telefones || []);
    setContatoOpen(true);
  };

  // Função para abrir menu de ações
  const handleAcoes = (event, id) => {
    setAnchorEl(event.currentTarget);
    setAcaoId(id);
  };

  // Marcar como quitado
  const marcarComoQuitado = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/emprestimos/${id}/fluxo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status_fluxo: "Quitado",
          pagamento_total: true,
          data_pagamento_real: new Date().toISOString().slice(0, 10) // Data atual
        })
      });
      setCobrancas(cobrancas => cobrancas.filter(e => e.id !== id));
    } catch (err) {
      alert('Erro ao marcar como quitado.');
    }
  };

  // Marcar pagamento dos 30%
  const marcarPagamento30 = async (item) => {
    try {
      const novaDataPagamento = new Date();
      novaDataPagamento.setDate(novaDataPagamento.getDate() + 30);

      await fetch(`http://localhost:5000/api/emprestimos/${item.id}/fluxo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagamento_30: true,
          quantidade_pagamento_30: (item.quantidade_pagamento_30 || 0) + 1,
          data_ultimo_pagamento_30: new Date().toISOString().slice(0, 10), // Data atual
          status_fluxo: "Prorrogado",
          data_pagamento: novaDataPagamento.toISOString().slice(0, 10) // Novo vencimento (+30 dias)
        })
      });
      setCobrancas(cobrancas => cobrancas.filter(e => e.id !== item.id));
    } catch (err) {
      alert('Erro ao marcar pagamento dos 30%.');
    }
  };

  // Marcar como não pagou
  const marcarNaoPagou = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/emprestimos/${id}/fluxo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status_fluxo: "Em atraso"
        })
      });
      setCobrancas(cobrancas => cobrancas.filter(e => e.id !== id));
    } catch (err) {
      alert('Erro ao marcar como não pagou.');
    }
  };

  const marcarAcao = (acao) => {
    const item = cobrancas.find(e => e.id === acaoId);
    if (!item) return;
    if (acao === "Quitado") marcarComoQuitado(item.id);
    if (acao === "Pagou só os juros") marcarPagamento30(item);
    if (acao === "Não pagou") marcarNaoPagou(item.id);
    setAnchorEl(null);
    setAcaoId(null);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Cobranças do Dia
      </Typography>
      <Button variant="outlined" onClick={onVoltar} sx={{ mb: 2 }}>
        Voltar
      </Button>
      {carregando ? (
        <Typography>Carregando...</Typography>
      ) : cobrancas.length === 0 ? (
        <Typography>Nenhum cliente para cobrança hoje.</Typography>
      ) : (
        <Grid container spacing={3}>
          {cobrancas.map((item) => {
            const valorDesejado = Number(item.valor_desejado);
            const valorTotal = valorDesejado + (valorDesejado * 0.3);

            return (
              <Grid item xs={12} md={6} key={item.id}>
                <Card sx={{ borderRadius: 3, boxShadow: 3, bgcolor: "#f9f9f9" }}>
                  <CardContent>
                    {/* Cabeçalho com nome e ID */}
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

                    {/* Status */}
                    <Box sx={{ mb: 1 }}>
                      <Chip label="Na data para pagamento" color="warning" sx={{ fontWeight: "bold" }} />
                    </Box>

                    {/* Datas */}
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <b>Deve ser pago em:</b> {new Date(item.data_pagamento).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <b>Data do Empréstimo:</b> {new Date(item.data_emprestimo).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />

                    {/* Valores */}
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <MonetizationOnIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <b>Valor investido:</b> R$ {Number(item.valor_desejado).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <MonetizationOnIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <b>Juros a receber:</b> R$ {item.juros_a_receber ? Number(item.juros_a_receber).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : "0,00"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <MonetizationOnIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <b>Valor total a receber:</b> R$ {valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />

                    {/* Telefones */}
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <b>Telefone:</b> {item.telefone || "Não informado"}
                      </Typography>
                      <Typography variant="body2">
                        <b>Contato alternativo:</b> {item.nome_contato ? `${item.nome_contato} - ${item.telefone_contato}` : "Não informado"}
                      </Typography>
                    </Box>
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
                      onClick={(e) => handleAcoes(e, item.id)}
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

      {/* Dialog de contatos */}
      <Dialog open={contatoOpen} onClose={() => setContatoOpen(false)}>
        <DialogTitle>Contatos do Cliente</DialogTitle>
        <DialogContent>
          {contatos.length === 0 ? (
            <Typography>Nenhum telefone cadastrado.</Typography>
          ) : (
            contatos.map((tel, idx) => (
              <Typography key={idx}>{tel}</Typography>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContatoOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Menu de ações */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => marcarAcao("Quitado")}>Marcar como Quitado</MenuItem>
        <MenuItem onClick={() => marcarAcao("Pagou só os juros")}>Pagou só os juros</MenuItem>
      </Menu>
    </Box>
  );
}