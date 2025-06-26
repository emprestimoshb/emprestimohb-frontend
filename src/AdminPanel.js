import jsPDF from 'jspdf';
import React, { useRef, useState, useEffect } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Toolbar,
  Modal,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  Tabs,
  Tab
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PaidIcon from '@mui/icons-material/Paid';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SavingsIcon from '@mui/icons-material/Savings';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Sidebar from './Sidebar';
import Cobrancas from "./Cobrancas";
import Atrasados from "./Atrasados"; // importe o novo componente
import Inadimplentes from "./Inadimplentes";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function formatarCpf(cpf) {
  if (!cpf) return '';
  const cpfLimpo = cpf.replace(/[^\d]/g, '');
  if (cpfLimpo.length !== 11) return cpf;
  return cpfLimpo.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

function gerarLinkWhatsapp(telefone) {
  if (!telefone) return '#';
  const telLimpo = telefone.replace(/[^\d]/g, '');
  const telComDdi = telLimpo.length === 11 ? `55${telLimpo}` : telLimpo;
  return `https://wa.me/${telComDdi}`;
}

function addDaysUTC(dateString, days) {
  const [ano, mes, dia] = dateString.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() + days);
  return data.toISOString().slice(0, 10);
}

// Função utilitária para somar dias a uma data (formato YYYY-MM-DD)
function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function AdminPanel(props) {
  const [cpfBusca, setCpfBusca] = useState('');
  const [cadastro, setCadastro] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [listaCadastros, setListaCadastros] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroData, setFiltroData] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroFluxo, setFiltroFluxo] = useState('');
  const [mostrarLista, setMostrarLista] = useState(true);
  const [emprestimos, setEmprestimos] = useState([]);
  const [emprestimoAtivo, setEmprestimoAtivo] = useState(null);
  const [valorDevido, setValorDevido] = useState(null);
  const [mostrarDataPagamento, setMostrarDataPagamento] = useState('');
  const [dataPagamentoEscolhida, setDataPagamentoEscolhida] = useState('');
  const [dataAprovacao, setDataAprovacao] = useState('');
  const [mostrarDataAprovacao, setMostrarDataAprovacao] = useState(false);
  const detalhesRef = useRef();
  const [estatisticas, setEstatisticas] = useState({
    valorInvestido: 0,
    totalAReceber: 0,
    valorRetornado: 0,
    faturamentoMensal: 0,
    jurosPagos: 0,
    perdido: 0
  });
  const voltarParaPainel = () => {
  setMenu("dashboard");
  setCadastro(null);
  setEmprestimoAtivo(null);
  setValorDevido(null);
  setMostrarLista(true);
};
  const [estatClientes, setEstatClientes] = useState({ total: 0, porStatus: [] });
  const [estatFluxo, setEstatFluxo] = useState({ porFluxo: [] });
  const [menu, setMenu] = useState("dashboard");
  const [novoValor, setNovoValor] = useState('');
  const [novaData, setNovaData] = useState('');
  const [emprestimosFicha, setEmprestimosFicha] = useState([]);
  const [editando, setEditando] = useState(false);
  const [editForm, setEditForm] = useState({
    valor_total_devido: '',
    data_pagamento: '',
    status_fluxo: '',
    juros_atraso: ''
  });

  useEffect(() => {
    if (editando && emprestimoAtivo) {
      setEditForm({
        valor_total_devido: emprestimoAtivo.valor_total_devido ?? '',
        data_pagamento: emprestimoAtivo.data_pagamento ?? '',
        status_fluxo: emprestimoAtivo.status_fluxo ?? '',
        juros_atraso: emprestimoAtivo.juros_atraso ?? ''
      });
    }
    // eslint-disable-next-line
  }, [editando]);

  // Função para salvar a edição do fluxo do empréstimo
  async function salvarEdicao() {
  // Antes de salvar:
  if (editForm.status_fluxo === "Quitado" && !editForm.data_pagamento_real) {
    editForm.data_pagamento_real = new Date().toISOString().slice(0, 10);
  }

  // Recalcula valor_total_devido se juros_atraso foi alterado
  let valorTotalDevido = editForm.valor_total_devido;
  if (
    editForm.juros_atraso !== '' &&
    emprestimoAtivo &&
    emprestimoAtivo.valor_desejado !== undefined &&
    emprestimoAtivo.valor_desejado !== null
  ) {
    valorTotalDevido = (Number(emprestimoAtivo.valor_desejado) * 1.3) + Number(editForm.juros_atraso);
  }

  await atualizarFluxoEmprestimo({
    valor_total_devido: valorTotalDevido !== '' ? Number(valorTotalDevido) : null,
    data_pagamento: editForm.data_pagamento,
    status_fluxo: editForm.status_fluxo,
    juros_atraso: editForm.juros_atraso !== '' ? Number(editForm.juros_atraso) : null,
    data_pagamento_real: editForm.data_pagamento_real
  });
  setEditando(false);
  // Atualize os dados do empréstimo ativo após salvar
  await buscarDetalhes(cadastro.cpf);
}

  const emprestimoInicial = Array.isArray(emprestimosFicha) && emprestimosFicha.length > 0
  ? emprestimosFicha.find(emp => emp.status_fluxo === 'Em análise') || emprestimosFicha[0]
  : null;

  // Estatísticas
  const buscarEstatisticas = async () => {
const res = await fetch(`${API_URL}/api/emprestimos/estatisticas`);
    if (!res.ok) return;
    const data = await res.json();
    setEstatisticas(data);
  };
  const buscarEstatClientes = async () => {
    const res = await fetch(`${API_URL}/api/cadastros/estatisticas`);
    if (!res.ok) return;
    const data = await res.json();
    setEstatClientes({
      total: data.total,
      porStatus: data.porStatus
    });
  };
  const buscarEstatFluxo = async () => {
    const res = await fetch(`${API_URL}/api/emprestimos/fluxo-estatisticas`);
    if (!res.ok) {
      setEstatFluxo({ porFluxo: [] });
      return;
    }
    const data = await res.json();
    setEstatFluxo({
      porFluxo: Object.entries((data && data.fluxoCount) ? data.fluxoCount : {}).map(([status_fluxo, count]) => ({
        status_fluxo,
        count
      }))
    });
  };

  useEffect(() => {
    buscarEstatisticas();
    buscarEstatClientes();
    buscarEstatFluxo();
  }, []);

 const buscarTodos = async () => {
  setMensagem('');
  setCadastro(null);
  setCarregandoLista(true);
  setMostrarLista(true);
  try {
    const [respCad, respEmp] = await Promise.all([
      fetch(`${API_URL}/api/cadastros`),
      fetch(`${API_URL}/api/emprestimos`)
    ]);
    if (respCad.ok) {
      const data = await respCad.json();
      setListaCadastros(data);
      if (data.length === 0) setMensagem('Nenhum cadastro encontrado.');
    } else {
      setMensagem('Erro ao buscar cadastros.');
    }
    if (respEmp.ok) {
      const emprestimosAll = await respEmp.json();
      setEmprestimos(emprestimosAll); // todos os empréstimos do sistema
    }
  } catch {
    setMensagem('Erro ao buscar cadastros.');
  }
  setCarregandoLista(false);
  buscarEstatisticas();
};

  // Buscar cadastro por CPF
  const handleBuscar = async (e) => {
    e.preventDefault();
    setMensagem('');
    setCadastro(null);

    const cpfLimpo = cpfBusca.replace(/[^\d]/g, '');

    const response = await fetch(`${API_URL}/api/cadastro/${cpfLimpo}`);
    if (response.ok) {
      const data = await response.json();
      setCadastro(data);
      setListaCadastros([]);
    } else {
      setMensagem('Cadastro não encontrado para este CPF.');
    }
  };

  // Buscar detalhes ao clicar em um cadastro da lista
  const buscarDetalhes = async (cpf) => {
    setMensagem('');
    setCadastro(null);
    setMostrarLista(false);
    const response = await fetch(`${API_URL}/api/cadastro/${cpf}`);
    if (response.ok) {
      const data = await response.json();
      setCadastro(data);

      // Buscar histórico de empréstimos
      const resEmp = await fetch(`${API_URL}/api/emprestimos/${cpf}`);
      if (resEmp.ok) {
        const listaEmp = await resEmp.json();
        setEmprestimosFicha(listaEmp); // <-- ESSENCIAL!

         // Pega o último empréstimo (mais recente)
        if (listaEmp.length > 0) {
          const emprestimoAtual = listaEmp[0];
          setEmprestimoAtivo(emprestimoAtual);

            // Buscar valor devido do empréstimo ativo
          const resVal = await fetch(`${API_URL}/api/emprestimos/${emprestimoAtual.id}/valor-devido`);
          if (resVal.ok) {
            setValorDevido(await resVal.json());
          } else {
            setValorDevido(null);
          }
        } else {
          setEmprestimoAtivo(null);
          setValorDevido(null);
        }
      } else {
        setEmprestimoAtivo(null);
        setValorDevido(null);
      }
    } else {
      setMensagem('Cadastro não encontrado.');
    }
    buscarEstatisticas();
  };

  // Atualizar status do cadastro
  async function atualizarStatus(novoStatus) {
    if (!cadastro) return;
    await fetch(`${API_URL}/api/cadastro/${cadastro.cpf}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus })
    });
    setCadastro({ ...cadastro, status: novoStatus });
  }

  // Atualizar fluxo do empréstimo ativo
  async function atualizarFluxoEmprestimo(novosDados) {
    if (!emprestimoAtivo) return;
    await fetch(`${API_URL}/api/emprestimos/${emprestimoAtivo.id}/fluxo`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novosDados)
    });
    await buscarDetalhes(cadastro.cpf);
    await buscarTodos();
  }

  // Quitar empréstimo ativo
  async function quitarEmprestimo() {
    if (!emprestimoAtivo) return;
    await atualizarFluxoEmprestimo({
      status_fluxo: 'Quitado',
      pagamento_total: true,
      pagamento_30: false,
      data_pagamento_real: new Date().toISOString().slice(0, 10),
      quantidade_pagamento_30: emprestimoAtivo.quantidade_pagamento_30 || 0,
      data_ultimo_pagamento_30: emprestimoAtivo.data_ultimo_pagamento_30 || null
    });
  }

  // Marcar pagamento dos 30%
  async function marcarPagamento30(dataPagamento) {
    if (!emprestimoAtivo) return;
    const proxData = addDaysUTC(dataPagamento, 30);
    await atualizarFluxoEmprestimo({
      status_fluxo: 'Prorrogado',
      pagamento_total: false,
      pagamento_30: true,
      data_pagamento_real: null,
      quantidade_pagamento_30: (emprestimoAtivo.quantidade_pagamento_30 || 0) + 1,
      data_ultimo_pagamento_30: dataPagamento,
      data_pagamento: proxData
    });
  }

  // Desfazer quitação
  async function desfazerQuitacao() {
    if (!emprestimoAtivo) return;
    await atualizarFluxoEmprestimo({
      status_fluxo: 'Em dia',
      pagamento_total: false,
      pagamento_30: false,
      data_pagamento_real: null
    });
  }

  // PDF (mantém igual)
  const exportarPdf = () => {
    if (!cadastro) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = 15;

    doc.setFontSize(18);
    doc.text('Ficha de Cadastro', 105, y, { align: 'center' });
    y += 10;

    // Bloco: Dados Pessoais
    doc.setFontSize(14);
    doc.text('Dados Pessoais', 10, y);
    y += 7;
    doc.setFontSize(11);
    doc.text(`Nome: ${cadastro.nome || ''}`, 10, y); y += 6;
    doc.text(`Indicação: ${cadastro.indicacao || ''}`, 10, y); y += 6;
    doc.text(`CPF: ${formatarCpf(cadastro.cpf) || ''}`, 10, y); y += 6;
    doc.text(`Redes Sociais: ${cadastro.redes_sociais || ''}`, 10, y); y += 8;

    // Bloco: Dados Profissionais
    doc.setFontSize(14);
    doc.text('Dados Profissionais', 10, y);
    y += 7;
    doc.setFontSize(11);
    doc.text(`Profissão: ${cadastro.profissao || ''}`, 10, y); y += 6;
    doc.text(`CEP (Trabalho): ${cadastro.cep_trabalho || ''}`, 10, y); y += 6;
    doc.text(`Endereço (Trabalho): ${cadastro.endereco_trabalho || ''}, ${cadastro.numero_trabalho || ''} ${cadastro.complemento_trabalho || ''}`, 10, y); y += 6;
    doc.text(`Bairro (Trabalho): ${cadastro.bairro_trabalho || '-'}`, 10, y); y += 8;

    // Bloco: Dados do Empréstimo
    doc.setFontSize(14);
    doc.text('Dados do Empréstimo', 10, y);
    y += 7;
    doc.setFontSize(11);
    doc.text(`Valor Desejado: R$ ${Number(cadastro.valor_desejado).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 10, y); y += 6;
    doc.text(`Data do Empréstimo: ${cadastro.data_emprestimo ? cadastro.data_emprestimo.split('-').reverse().join('/') : ''}`, 10, y); y += 6;
    doc.text(`Data do Pagamento: ${cadastro.data_pagamento ? cadastro.data_pagamento.split('-').reverse().join('/') : ''}`, 10, y); y += 8;

    // Bloco: Contatos
    doc.setFontSize(14);
    doc.text('Contatos', 10, y);
    y += 7;
    doc.setFontSize(11);
    doc.text(`Telefone/WhatsApp: ${cadastro.telefone || ''}`, 10, y); y += 6;
    doc.text(`Telefone de algum contato: ${cadastro.telefone_contato || ''}`, 10, y); y += 6;
    doc.text(`Nome do contato: ${cadastro.nome_contato || ''}`, 10, y); y += 8;

    // Bloco: Endereço Residencial
    doc.setFontSize(14);
    doc.text('Endereço Residencial', 10, y);
    y += 7;
    doc.setFontSize(11);
    doc.text(`CEP (Residencial): ${cadastro.cep_residencial || ''}`, 10, y); y += 6;
    doc.text(`Endereço (Residencial): ${cadastro.endereco_residencial || ''}, ${cadastro.numero_residencial || ''} ${cadastro.complemento_residencial || ''}`, 10, y); y += 6;
    doc.text(`Bairro: ${cadastro.bairro || ''}`, 10, y); y += 6;
    doc.text(`Ponto de Referência: ${cadastro.ponto_referencia || ''}`, 10, y); y += 8;

    doc.save(`ficha_${cadastro.cpf}.pdf`);
  };

  const [pagina, setPagina] = useState("dashboard"); // ou o nome que você usa
    const [tabDetalhes, setTabDetalhes] = useState(0); // Novo estado para a aba de detalhes

  // Sidebar à esquerda
  return (
    <Box sx={{ display: "flex", background: "#f6f8fa", minHeight: "100vh" }}>
      <Sidebar selected={pagina} onSelect={setPagina} onPainel={() => setPagina("dashboard")} />

      {/* Conteúdo do painel à direita */}
      <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 3 } }}>
        <Toolbar />
        {/* Renderize o conteúdo conforme o menu selecionado */}
        {pagina === "dashboard" && (
          <Box sx={{ maxWidth: 1400, mx: "auto", mt: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: "#222" }}>
              Painel Administrativo
            </Typography>

            {/* Cards, busca, filtros e lista só aparecem se NÃO estiver vendo detalhes */}
            {!cadastro && (
              <>
                {/* Cards de estatísticas */}
                {estatisticas && (
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3, background: "linear-gradient(135deg, #e3f6e8 60%, #fff 100%)" }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <AssessmentIcon sx={{ fontSize: 40, color: "#388e3c" }} />
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Valor total investido
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: "#222" }}>
                            R$ {(estatisticas.valorInvestido ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3, background: "linear-gradient(135deg, #d1f2fa 60%, #fff 100%)" }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <PaidIcon sx={{ fontSize: 40, color: "#0288d1" }} />
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Valor investido no mês
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: "#222" }}>
                            R$ {(estatisticas.valorInvestidoMes ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3, background: "linear-gradient(135deg, #e6f7fa 60%, #fff 100%)" }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <TrendingUpIcon sx={{ fontSize: 40, color: "#00bcd4" }} />
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Faturamento mensal
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: "#222" }}>
                            R$ {(estatisticas.faturamentoMensal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3, background: "linear-gradient(135deg, #f0e6fa 60%, #fff 100%)" }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <SavingsIcon sx={{ fontSize: 40, color: "#8e24aa" }} />
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Valor investido retornado
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: "#222" }}>
                            R$ {(estatisticas.valorRetornado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3, background: "linear-gradient(135deg, #fffbe6 60%, #fff 100%)" }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <MonetizationOnIcon sx={{ fontSize: 40, color: "#fbc02d" }} />
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Juros pagos (30%)
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: "#222" }}>
                            R$ {(estatisticas.jurosPagos ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3, background: "linear-gradient(135deg, #e3eaf6 60%, #fff 100%)" }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <ReceiptLongIcon sx={{ fontSize: 40, color: "#1976d2" }} />
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Valor total a receber
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: "#222" }}>
                            R$ {(estatisticas.totalAReceber ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3, background: "linear-gradient(135deg, #ffeaea 60%, #fff 100%)" }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <WarningAmberIcon sx={{ fontSize: 40, color: "#d32f2f" }} />
                          <Typography variant="subtitle2" color="error" gutterBottom>
                            Valor perdido
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: "#d32f2f" }}>
                            R$ {(estatisticas.perdido ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {/* Filtros e busca */}
                <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                  <form onSubmit={handleBuscar} style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <TextField
                      label="Buscar por CPF"
                      value={cpfBusca}
                      onChange={e => setCpfBusca(e.target.value)}
                      placeholder="Digite o CPF"
                      size="small"
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ flex: 1, minWidth: 220 }}
                    />
                    <Button type="submit" variant="contained" color="primary" sx={{ height: 40, minWidth: 120 }}>
                      BUSCAR
                    </Button>
                    <Button
                      type="button"
                      variant="contained"
                      color="success"
                      onClick={() => {
                        setCadastro(null);
                        setEmprestimoAtivo(null);
                        setValorDevido(null);
                        setMostrarLista(true);
                        buscarTodos();
                      }}
                      sx={{ height: 40, minWidth: 120 }}
                    >
                      VER TODOS
                    </Button>
                  </form>
                                 <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Filtrar por nome"
                        value={filtroNome}
                        onChange={e => setFiltroNome(e.target.value)}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Data do Empréstimo"
                        type="date"
                        value={filtroData}
                        onChange={e => setFiltroData(e.target.value)}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Status"
                        select
                        value={filtroStatus}
                        onChange={e => setFiltroStatus(e.target.value)}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 180 }}
                      >
                        <MenuItem value="">Todos os status</MenuItem>
                        <MenuItem value="Aprovado">Aprovado</MenuItem>
                        <MenuItem value="Em análise">Em análise</MenuItem>
                        <MenuItem value="Rejeitado">Rejeitado</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Fluxo do Empréstimo"
                        select
                        value={filtroFluxo}
                        onChange={e => setFiltroFluxo(e.target.value)}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 180 }}
                      >
                        <MenuItem value="">Todos os fluxos</MenuItem>
                        <MenuItem value="Em dia">Em dia</MenuItem>
                        <MenuItem value="Em atraso">Em atraso</MenuItem>
                        <MenuItem value="Prorrogado">Prorrogado</MenuItem>
                        <MenuItem value="Quitado">Quitado</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Lista de cadastros */}
                {carregandoLista && <Typography sx={{ mb: 2 }}>Carregando cadastros...</Typography>}
                {mostrarLista && listaCadastros.length > 0 && (
                  <Paper elevation={2} sx={{ mb: 4, borderRadius: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, p: 2 }}>Todos os Cadastros</Typography>
                    <TableContainer>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow sx={{ background: '#f7faff' }}>
                            <TableCell align="center"><b>Nome</b></TableCell>
                            <TableCell align="center"><b>CPF</b></TableCell>
                            <TableCell align="center"><b>Data do Empréstimo</b></TableCell>
                            <TableCell align="center"><b>Status</b></TableCell>
                            <TableCell align="center"><b>Fluxo do Empréstimo</b></TableCell>
                            <TableCell align="center"><b>Ações</b></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {listaCadastros
                            .filter(cad => {
                              const emprestimoCliente = emprestimos.filter(emp => emp.cpf === cad.cpf);
                              let ultimoEmprestimo = null;
                              if (emprestimoCliente.length > 0) {
                                ultimoEmprestimo = [...emprestimoCliente].sort((a, b) => {
                                  const dataA = new Date(b.data_emprestimo) - new Date(a.data_emprestimo);
                                  if (dataA !== 0) return dataA;
                                  return b.id - a.id; // desempate por id
                                })[0];
                              }
                              return (
                                (!filtroNome || cad.nome.toLowerCase().includes(filtroNome.toLowerCase())) &&
                                (!filtroData || (ultimoEmprestimo && ultimoEmprestimo.data_emprestimo && ultimoEmprestimo.data_emprestimo.slice(0, 10) === filtroData)) &&
                                (!filtroStatus || cad.status === filtroStatus) &&
                                (!filtroFluxo || (ultimoEmprestimo && ultimoEmprestimo.status_fluxo === filtroFluxo))
                              );
                            })
                            .map((cad, idx) => {
                              const emprestimoCliente = emprestimos.filter(emp => emp.cpf === cad.cpf);
                              let ultimoEmprestimo = null;
                              if (emprestimoCliente.length > 0) {
                                ultimoEmprestimo = [...emprestimoCliente].sort((a, b) => {
                                  const dataA = new Date(b.data_emprestimo) - new Date(a.data_emprestimo);
                                  if (dataA !== 0) return dataA;
                                  return b.id - a.id; // desempate por id
                                })[0];
                              }
                              return (
                                <TableRow key={cad.cpf} hover sx={{ background: idx % 2 === 0 ? "#fafbfc" : "#f5f7fa" }}>
                                  <TableCell>{cad.nome}</TableCell>
                                  <TableCell>{formatarCpf(cad.cpf)}</TableCell>
                                  <TableCell align="center">
                                    {ultimoEmprestimo && ultimoEmprestimo.data_emprestimo
                                      ? new Date(ultimoEmprestimo.data_emprestimo).toLocaleDateString('pt-BR')
                                      : ''}
                                  </TableCell>
                                  <TableCell align="center">
                                    <span style={{
                                      color: cad.status === 'Aprovado' ? 'green' :
                                            cad.status === 'Rejeitado' ? 'red' : 'orange',
                                      fontWeight: 'bold'
                                    }}>
                                      {cad.status}
                                    </span>
                                  </TableCell>
                                  <TableCell align="center">
                                    <span style={{
                                      color:
                                        ultimoEmprestimo?.status_fluxo === 'Quitado' ? 'gray' :
                                        ultimoEmprestimo?.status_fluxo === 'Prorrogado' ? 'blue' :
                                        ultimoEmprestimo?.status_fluxo === 'Inadimplente' ? 'red' :
                                        ultimoEmprestimo?.status_fluxo === 'Em atraso' ? 'orange' :
                                        'green',
                                      fontWeight: 'bold'
                                    }}>
                                      {ultimoEmprestimo ? (ultimoEmprestimo.status_fluxo || 'Em dia') : ''}
                                    </span>
                                  </TableCell>
                                  <TableCell align="center">
                                    <IconButton
                                      color="primary"
                                      onClick={() => buscarDetalhes(cad.cpf)}
                                      title="Ver detalhes"
                                    >
                                      <VisibilityIcon />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}
              </>
            )}

            {/* Detalhes do cadastro */}
            {cadastro && (
              <Box sx={{ mb: 4 }}>
                <Button
                  variant="outlined"
                  sx={{ mb: 2, mr: 2 }}
                  onClick={() => { setCadastro(null); setMostrarLista(true); }}
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mb: 2 }}
                  onClick={exportarPdf}
                >
                  Baixar ficha em PDF
                </Button>

                {/* Tabs para detalhes */}
                <Paper elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
                  <Tabs
                    value={tabDetalhes}
                    onChange={(_, v) => setTabDetalhes(v)}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    <Tab label="Dados Pessoais" />
                    <Tab label="Profissionais" />
                    <Tab label="Empréstimo" />
                    <Tab label="Contatos" />
                    <Tab label="Endereço" />
                    <Tab label="Documentos" />
                  </Tabs>
                  <Box sx={{ p: 3 }}>
                    {tabDetalhes === 0 && (
                      <Box display="flex" alignItems="center" gap={3}>
                        <Avatar sx={{ width: 64, height: 64, bgcolor: "#1976d2", fontSize: 32 }}>
                          {cadastro.nome?.[0]?.toUpperCase() || "?"}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" color="primary" gutterBottom>Dados Pessoais</Typography>
                          <Typography><b>Nome:</b> {cadastro.nome}</Typography>
                          <Typography><b>Indicação:</b> {cadastro.indicacao}</Typography>
                          <Typography><b>CPF:</b> {formatarCpf(cadastro.cpf)}</Typography>
                          <Typography><b>Redes Sociais:</b> {cadastro.redes_sociais}</Typography>
                        </Box>
                      </Box>
                    )}
                    {tabDetalhes === 1 && (
                      <Box>
                        <Typography variant="h6" color="primary" gutterBottom>Dados Profissionais</Typography>
                        <Typography><b>Profissão:</b> {cadastro.profissao}</Typography>
                        <Typography><b>CEP (Trabalho):</b> {cadastro.cep_trabalho}</Typography>
                        <Typography><b>Endereço (Trabalho):</b> {cadastro.endereco_trabalho}, {cadastro.numero_trabalho} {cadastro.complemento_trabalho}</Typography>
                        <Typography><b>Bairro (Trabalho):</b> {cadastro.bairro_trabalho || '-'}</Typography>
                      </Box>
                    )}
                    {tabDetalhes === 2 && (
                      <Box>
                        <Typography variant="h6" color="primary" gutterBottom>Dados do Empréstimo</Typography>
                        <Typography><b>Valor Desejado:</b> R$ {emprestimoInicial?.valor_desejado ? Number(emprestimoInicial.valor_desejado).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}</Typography>
                        <Typography><b>Data do Empréstimo:</b> {emprestimoInicial?.data_emprestimo ? new Date(emprestimoInicial.data_emprestimo).toLocaleDateString('pt-BR') : '-'}</Typography>
                      </Box>
                    )}
                    {tabDetalhes === 3 && (
                      <Box>
                        <Typography variant="h6" color="primary" gutterBottom>Contatos</Typography>
                        <Typography>
                          <b>Telefone/WhatsApp:</b> {cadastro.telefone}
                          {cadastro.telefone && (
                            <a
                              href={gerarLinkWhatsapp(cadastro.telefone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ marginLeft: 8, textDecoration: 'none' }}
                              title="Conversar no WhatsApp"
                            >
                              <FaWhatsapp style={{ color: '#25D366', fontSize: 22, verticalAlign: 'middle' }} />
                            </a>
                          )}
                        </Typography>
                        <Typography>
                          <b>Telefone de algum contato:</b> {cadastro.telefone_contato}
                          {cadastro.telefone_contato && (
                            <a
                              href={gerarLinkWhatsapp(cadastro.telefone_contato)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ marginLeft: 8, textDecoration: 'none' }}
                              title="Conversar no WhatsApp"
                            >
                              <FaWhatsapp style={{ color: '#25D366', fontSize: 22, verticalAlign: 'middle' }} />
                            </a>
                          )}
                        </Typography>
                        <Typography><b>Nome do contato:</b> {cadastro.nome_contato}</Typography>
                      </Box>
                    )}
                    {tabDetalhes === 4 && (
                      <Box>
                        <Typography variant="h6" color="primary" gutterBottom>Endereço Residencial</Typography>
                        <Typography><b>CEP (Residencial):</b> {cadastro.cep_residencial}</Typography>
                        <Typography><b>Endereço (Residencial):</b> {cadastro.endereco_residencial}, {cadastro.numero_residencial} {cadastro.complemento_residencial}</Typography>
                        <Typography><b>Bairro:</b> {cadastro.bairro}</Typography>
                        <Typography><b>Ponto de Referência:</b> {cadastro.ponto_referencia}</Typography>
                      </Box>
                    )}
                    {tabDetalhes === 5 && (
                      <Box>
                        <Typography variant="h6" color="primary" gutterBottom>Documentos Enviados</Typography>
                        <Grid container spacing={2}>
                          {/* Comprovante de Renda */}
                          <Grid item xs={12} sm={3}>
                            <b style={{ fontSize: 13 }}>Comprovante de Renda</b><br />
                            {cadastro.comprovante_renda && (
                              <>
                                {cadastro.comprovante_renda.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                  <img
                                    src={`${API_URL}/uploads/${cadastro.comprovante_renda}`}
                                    alt="Comprovante de Renda"
                                    style={{ width: 80, height: 80, objectFit: 'cover', marginBottom: 6, borderRadius: 4, border: '1px solid #ccc' }}
                                  />
                                ) : (
                                  <span style={{ marginBottom: 6, display: 'block' }}>Arquivo PDF</span>
                                )}
                                <div>
                                  <a href={`${API_URL}/uploads/${cadastro.comprovante_renda}`} target="_blank" rel="noopener noreferrer">
                                    <Button size="small" variant="outlined">Baixar</Button>
                                  </a>
                                </div>
                              </>
                            )}
                          </Grid>
                          {/* Comprovante de Residência */}
                          <Grid item xs={12} sm={3}>
                            <b style={{ fontSize: 13 }}>Comprovante de Residência</b><br />
                            {cadastro.comprovante_residencia && (
                              <>
                                {cadastro.comprovante_residencia.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                  <img
                                    src={`${API_URL}/uploads/${cadastro.comprovante_residencia}`}
                                    alt="Comprovante de Residência"
                                    style={{ width: 80, height: 80, objectFit: 'cover', marginBottom: 6, borderRadius: 4, border: '1px solid #ccc' }}
                                  />
                                ) : (
                                  <span style={{ marginBottom: 6, display: 'block' }}>Arquivo PDF</span>
                                )}
                                <div>
                                  <a href={`${API_URL}/uploads/${cadastro.comprovante_residencia}`} target="_blank" rel="noopener noreferrer">
                                    <Button size="small" variant="outlined">Baixar</Button>
                                  </a>
                                </div>
                              </>
                            )}
                          </Grid>
                          {/* Foto Segurando Documento */}
                          <Grid item xs={12} sm={3}>
                            <b style={{ fontSize: 13 }}>Foto Segurando Documento</b><br />
                            {cadastro.foto_segurando_documento && (
                              <>
                                {cadastro.foto_segurando_documento.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                  <img
                                    src={`${API_URL}/uploads/${cadastro.foto_segurando_documento}`}
                                    alt="Foto Segurando Documento"
                                    style={{ width: 80, height: 80, objectFit: 'cover', marginBottom: 6, borderRadius: 4, border: '1px solid #ccc' }}
                                  />
                                ) : (
                                  <span style={{ marginBottom: 6, display: 'block' }}>Arquivo PDF</span>
                                )}
                                <div>
                                  <a href={`${API_URL}/uploads/${cadastro.foto_segurando_documento}`} target="_blank" rel="noopener noreferrer">
                                    <Button size="small" variant="outlined">Baixar</Button>
                                  </a>
                                </div>
                              </>
                            )}
                          </Grid>
                          {/* Documento com Foto - Frente */}
                          <Grid item xs={12} sm={3}>
                            <b style={{ fontSize: 13 }}>Documento com Foto - Frente</b><br />
                            {cadastro.documento_foto_frente && (
                              <>
                                {cadastro.documento_foto_frente.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                  <img
                                    src={`${API_URL}/uploads/${cadastro.documento_foto_frente}`}
                                    alt="Documento com Foto - Frente"
                                    style={{ width: 80, height: 80, objectFit: 'cover', marginBottom: 6, borderRadius: 4, border: '1px solid #ccc' }}
                                  />
                                ) : (
                                  <span style={{ marginBottom: 6, display: 'block' }}>Arquivo PDF</span>
                                )}
                                <div>
                                  <a href={`${API_URL}/uploads/${cadastro.documento_foto_frente}`} target="_blank" rel="noopener noreferrer">
                                    <Button size="small" variant="outlined">Baixar</Button>
                                  </a>
                                </div>
                              </>
                            )}
                          </Grid>
                          {/* Documento com Foto - Verso */}
                          <Grid item xs={12} sm={3}>
                            <b style={{ fontSize: 13 }}>Documento com Foto - Verso</b><br />
                            {cadastro.documento_foto_verso && (
                              <>
                                {cadastro.documento_foto_verso.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                  <img
                                    src={`${API_URL}/uploads/${cadastro.documento_foto_verso}`}
                                    alt="Documento com Foto - Verso"
                                    style={{ width: 80, height: 80, objectFit: 'cover', marginBottom: 6, borderRadius: 4, border: '1px solid #ccc' }}
                                  />
                                ) : (
                                  <span style={{ marginBottom: 6, display: 'block' }}>Arquivo PDF</span>
                                )}
                                <div>
                                  <a href={`${API_URL}/uploads/${cadastro.documento_foto_verso}`} target="_blank" rel="noopener noreferrer">
                                    <Button size="small" variant="outlined">Baixar</Button>
                                  </a>
                                </div>
                              </>
                            )}
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Box>
                </Paper>

                {/* Fluxo do Empréstimo e ações permanecem iguais */}
                <Card sx={{ mb: 2, background: '#f7faff' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      {/* Status do fluxo - MANTIDO COMO ESTÁ */}
                      <Typography>
                        <b>Status do Fluxo:</b>{' '}
                        <span style={{
                          color:
                            emprestimoAtivo.status_fluxo === 'Quitado' ? 'gray' :
                            emprestimoAtivo.status_fluxo === 'Prorrogado' ? 'blue' :
                            emprestimoAtivo.status_fluxo === 'Inadimplente' ? 'red' :
                            emprestimoAtivo.status_fluxo === 'Em atraso' ? 'orange' :
                            'green',
                          fontWeight: 'bold'
                        }}>
                          {emprestimoAtivo.status_fluxo || 'Em dia'}
                        </span>
                      </Typography>
                      <Button variant="outlined" color="primary" size="small" onClick={() => setEditando(true)}>
                        Editar
                      </Button>
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1}>
                      <Typography>
                        <b>Data do Empréstimo:</b>{' '}
                        {emprestimoAtivo.data_emprestimo
                          ? new Date(emprestimoAtivo.data_emprestimo).toLocaleDateString('pt-BR')
                          : '-'}
                      </Typography>
                      <Typography>
                        <b>Data do Próximo Pagamento:</b>{' '}
                        {emprestimoAtivo.data_pagamento
                          ? new Date(emprestimoAtivo.data_pagamento).toLocaleDateString('pt-BR')
                          : '-'}
                      </Typography>
                      <Typography>
                        <b>Data do Pagamento Real:</b>{' '}
                        {emprestimoAtivo.data_pagamento_real
                          ? new Date(emprestimoAtivo.data_pagamento_real).toLocaleDateString('pt-BR')
                          : '-'}
                      </Typography>
                      <Typography>
                        <b>Pagamento somente dos juros (30%):</b> {emprestimoAtivo.pagamento_30 ? 'Sim' : 'Não'}
                        {emprestimoAtivo.quantidade_pagamento_30 > 0 && (
                          <span style={{ marginLeft: 8 }}>
                            <b>({emprestimoAtivo.quantidade_pagamento_30}x)</b>
                          </span>
                        )}
                      </Typography>
                      <Typography>
                        <b>Data do Último Pagamento 30%:</b>{' '}
                        {emprestimoAtivo.data_ultimo_pagamento_30
                          ? new Date(emprestimoAtivo.data_ultimo_pagamento_30).toLocaleDateString('pt-BR')
                          : '-'}
                      </Typography>
                      <Typography>
                        <b>Valor Emprestado:</b> R$ {emprestimoAtivo.valor_desejado ? Number(emprestimoAtivo.valor_desejado).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}
                      </Typography>
                      <Typography>
                        <b>Juros 30% pagos:</b> R$ {emprestimoAtivo.quantidade_pagamento_30 && emprestimoAtivo.valor_desejado
                          ? (Number(emprestimoAtivo.valor_desejado) * 0.3 * Number(emprestimoAtivo.quantidade_pagamento_30)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                          : '0,00'}
                      </Typography>
                      <Typography>
                        <b>Dias em atraso:</b> {emprestimoAtivo.dias_atraso ?? 0}
                      </Typography>
                      <Typography>
                        <b>Juros de atraso:</b> R$ {emprestimoAtivo.juros_atraso ? Number(emprestimoAtivo.juros_atraso).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </Typography>
                      <Typography sx={{ color: 'red', fontWeight: 'bold' }}>
                        Valor Total Devido: R$ {emprestimoAtivo.status_fluxo === 'Quitado'
                          ? '0,00'
                          : (
                              emprestimoAtivo.valor_total_devido !== null && emprestimoAtivo.valor_total_devido !== undefined
                                ? Number(emprestimoAtivo.valor_total_devido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                                : '0,00'
                            )
                      }
                      </Typography>
                      <Typography sx={{ color: 'green', fontWeight: 'bold' }}>
                        Valor Quitado: R$ {emprestimoAtivo.valor_quitado
                          ? Number(emprestimoAtivo.valor_quitado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                          : '0,00'}
                      </Typography>
                    </Box>
                    {/* Botões de ação */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => setMostrarDataPagamento('quitado')}
                        disabled={!!mostrarDataPagamento}
                      >
                        Marcar como Quitado
                      </Button>
                      <Button
                        variant="contained"
                        color="warning"
                        onClick={() => setMostrarDataPagamento('30')}
                        disabled={!!mostrarDataPagamento}
                      >
                        Marcar Pagamento dos 30%
                      </Button>
                      {emprestimoAtivo.status_fluxo === 'Quitado' && (
                        <Button
                          variant="outlined"
                          color="warning"
                          onClick={desfazerQuitacao}
                        >
                          Desfazer Quitação
                        </Button>
                      )}
                    </Box>
                    {/* Bloco de seleção de data */}
                    {mostrarDataPagamento && (
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TextField
                          label="Data do pagamento"
                          type="date"
                          size="small"
                          value={dataPagamentoEscolhida}
                          onChange={e => setDataPagamentoEscolhida(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                        <Button
                          variant="contained"
                          onClick={async () => {
                            if (!dataPagamentoEscolhida) return;
                            if (mostrarDataPagamento === 'quitado') {
                              await atualizarFluxoEmprestimo({
                                status_fluxo: 'Quitado',
                                pagamento_total: true,
                                pagamento_30: false,
                                data_pagamento_real: dataPagamentoEscolhida,
                                quantidade_pagamento_30: emprestimoAtivo.quantidade_pagamento_30 || 0,
                                data_ultimo_pagamento_30: emprestimoAtivo.data_ultimo_pagamento_30 || null
                              });
                            } else if (mostrarDataPagamento === '30') {
                              await marcarPagamento30(dataPagamentoEscolhida);
                            }
                            setMostrarDataPagamento('');
                            setDataPagamentoEscolhida('');
                          }}
                        >
                          Confirmar
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => {
                            setMostrarDataPagamento('');
                            setDataPagamentoEscolhida('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </Box>
                    )}

                    {/* Novo Empréstimo */}
                    {emprestimoAtivo.status_fluxo === 'Quitado' && (
                      <Card sx={{ mt: 3, p: 2, background: '#e8f5e9' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 2 }}>
                          Novo Empréstimo
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Valor do novo empréstimo"
                              value={novoValor}
                              onChange={e => setNovoValor(e.target.value)}
                              size="small"
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              type="number"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Data do novo empréstimo"
                              type="date"
                              value={novaData}
                              onChange={e => setNovaData(e.target.value)}
                              size="small"
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                        </Grid>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={async () => {
                              setMensagem('');
                              if (!novoValor || !novaData) {
                                setMensagem('Por favor, preencha o valor e a data do novo empréstimo.');
                                return;
                              }
                              const valorNumerico = parseFloat(novoValor.replace(',', '.'));
                              if (isNaN(valorNumerico)) {
                                setMensagem('Valor inválido.');
                                return;
                              }
                              const novaDataFormatada = new Date(novaData).toISOString().slice(0, 10);
                              const dataProxPagamento = new Date(novaData);
                              dataProxPagamento.setDate(dataProxPagamento.getDate() + 30);
                              const data_pagamento = dataProxPagamento.toISOString().slice(0, 10);

                                const resp = await fetch(`${API_URL}/api/emprestimos`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  cpf: cadastro.cpf,
                                  valor_desejado: valorNumerico,
                                  data_emprestimo: novaDataFormatada,
                                  data_pagamento,
                                  status_fluxo: 'Em dia',
                                  pagamento_total: false,
                                  pagamento_30: false,
                                  dias_atraso: 0,
                                  juros_atraso: 0,
                                  quantidade_pagamento_30: 0,
                                  data_ultimo_pagamento_30: null,
                                  data_pagamento_real: null
                                })
                              });

                                if (resp.ok) {
                                setMensagem('Novo empréstimo criado com sucesso!');
                                setNovoValor('');
                                setNovaData('');
                                await buscarDetalhes(cadastro.cpf);
                                await buscarTodos();
                              } else {
                                const erro = await resp.json();
                                setMensagem('Erro ao criar novo empréstimo: ' + (erro.erro || 'Erro desconhecido'));
                              }
                            }}
                          >
                            Confirmar Novo Empréstimo
                          </Button>
                        </Box>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        )}

        {pagina === "cobrancas" && (
          <Cobrancas onVoltar={() => setPagina("dashboard")} />
        )}

        {pagina === "atrasados" && (
          <Atrasados onVoltar={() => setPagina("dashboard")} />
        )}

        {pagina === "inadimplentes" && (
          <Inadimplentes onVoltar={() => setPagina("dashboard")} />
        )}

        {menu === "lista_negra" && (
          <Typography variant="h5" sx={{ mt: 4 }}>Lista Negra (em breve)</Typography>
        )}
      </Box>

      <Modal open={editando} onClose={() => setEditando(false)}>
  <Box
    sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      bgcolor: 'background.paper',
      borderRadius: 2,
      boxShadow: 24,
      p: 3,
      minWidth: 350
    }}
  >
    <Typography variant="h6" sx={{ mb: 2 }}>Editar Fluxo do Empréstimo</Typography>
    <TextField
      label="Valor Total Devido"
      type="number"
      value={editForm.valor_total_devido}
      onChange={e => setEditForm(f => ({ ...f, valor_total_devido: e.target.value }))}
      fullWidth sx={{ mb: 2 }}
    />
    <TextField
      label="Data do Pagamento"
      type="date"
      value={editForm.data_pagamento ? editForm.data_pagamento.slice(0,10) : ''}
      onChange={e => setEditForm(f => ({ ...f, data_pagamento: e.target.value }))}
      fullWidth sx={{ mb: 2 }}
      InputLabelProps={{ shrink: true }}
    />
    <TextField
      label="Status do Fluxo"
      select
      value={editForm.status_fluxo}
      onChange={e => setEditForm(f => ({ ...f, status_fluxo: e.target.value }))}
      fullWidth
      sx={{ mb: 2 }}
      SelectProps={{
        MenuProps: {
          PaperProps: {
            sx: {
              zIndex: 1400 // maior que o overlay do modal
            }
          }
        }
      }}
    >
      <MenuItem value="Em dia">Em dia</MenuItem>
      <MenuItem value="Em atraso">Em atraso</MenuItem>
      <MenuItem value="Prorrogado">Prorrogado</MenuItem>
      <MenuItem value="Quitado">Quitado</MenuItem>
      <MenuItem value="Inadimplente">Inadimplente</MenuItem>
    </TextField>
    <TextField
      label="Juros de Atraso"
      type="number"
      value={editForm.juros_atraso}
      onChange={e => setEditForm(f => ({ ...f, juros_atraso: e.target.value }))}
      fullWidth sx={{ mb: 2 }}
    />
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
      <Button variant="contained" color="primary" onClick={salvarEdicao}>
        Salvar
      </Button>
      <Button variant="outlined" color="error" onClick={() => setEditando(false)}>
        Cancelar
      </Button>
    </Box>
  </Box>
</Modal>
    </Box>
  );
}

export default AdminPanel;
