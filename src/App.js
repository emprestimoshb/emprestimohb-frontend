import React, { useState } from 'react';
import './App.css';
import Navbar from './Navbar';
import AdminLogin from './AdminLogin';
import AdminPanel from './AdminPanel';
import Container from '@mui/material/Container';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Box,
  InputLabel,
  FormControl,
  Select,
  AppBar
} from '@mui/material';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const TAMANHO_MAXIMO = 20 * 1024 * 1024; // 20MB

function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  return true;
}

function validarTelefone(telefone) {
  // Aceita formatos com ou sem DDD, com 9 dígitos, só números
  const tel = telefone.replace(/[^\d]/g, '');
  return tel.length === 10 || tel.length === 11;
}

function validarCEP(cep) {
  return /^[0-9]{8}$/.test(cep);
}

const theme = createTheme({
  components: {
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 'bold',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.07)',
          borderRadius: 12,
        },
      },
    },
  },
  palette: {
    background: {
      default: "#f5f6fa"
    }
  }
});

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [form, setForm] = useState({
    nome: '',
    indicacao: '',
    cpf: '',
    profissao: '',
    cepTrabalho: '',
    enderecoTrabalho: '',
    numeroTrabalho: '',
    complementoTrabalho: '',
    bairroTrabalho: '',
    telefone: '',
    telefoneContato: '',
    nomeContato: '',
    cepResidencial: '',
    enderecoResidencial: '',
    numeroResidencial: '',
    complementoResidencial: '',
    bairro: '',
    pontoReferencia: '',
    redesSociais: '',
  });

  const [comprovanteRenda, setComprovanteRenda] = useState(null);
  const [comprovanteResidencia, setComprovanteResidencia] = useState(null);
  const [documentoFotoFrente, setDocumentoFotoFrente] = useState(null);
  const [documentoFotoVerso, setDocumentoFotoVerso] = useState(null);
  const [fotoSegurandoDocumento, setFotoSegurandoDocumento] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [adminLogado, setAdminLogado] = useState(false);
  const [tela, setTela] = useState('formulario');
  const [cadastroEnviado, setCadastroEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  // Função para buscar endereço pelo CEP (ViaCEP)
  const buscarEndereco = async (cep, tipo) => {
    if (cep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        if (tipo === 'trabalho') {
          setForm(f => ({
            ...f,
            enderecoTrabalho: data.logradouro,
            bairroTrabalho: data.bairro,
          }));
        } else if (tipo === 'residencial') {
          setForm(f => ({
            ...f,
            enderecoResidencial: data.logradouro,
            bairro: data.bairro,
          }));
        }
      }
    } catch (e) {
      // Pode exibir erro se quiser
    }
  };

  // Função para obter data de hoje no formato yyyy-mm-dd
  const getToday = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Função para somar 30 dias
  const add30Days = (dateStr) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  // Atualize o handleChange para tratar a data do empréstimo
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dataEmprestimo') {
      setForm({
        ...form,
        dataEmprestimo: value,
        dataPagamento: add30Days(value)
      });
    } else {
      setForm({ ...form, [name]: value });

      // Busca automática do endereço ao digitar o CEP
      if (name === 'cepTrabalho' && value.length === 8) {
        buscarEndereco(value, 'trabalho');
      }
      if (name === 'cepResidencial' && value.length === 8) {
        buscarEndereco(value, 'residencial');
      }
    }
  };

  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setMensagem('Tipo de arquivo não permitido. Envie apenas imagens (JPG, PNG) ou PDF.');
      e.target.value = '';
      return;
    }
    if (file.size > TAMANHO_MAXIMO) {
      setMensagem('Arquivo muito grande. O tamanho máximo permitido é 5MB.');
      e.target.value = '';
      return;
    }
    setMensagem('');
    setter(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');

    // Validação do CPF logo no início
    if (!validarCPF(form.cpf)) {
      setMensagem('CPF inválido. Verifique e tente novamente.');
      setLoading(false);
      return;
    }

    // Validação do telefone
    if (!validarTelefone(form.telefone)) {
      setMensagem('Telefone inválido. Informe um número válido com DDD.');
      setLoading(false);
      return;
    }
    if (!validarTelefone(form.telefoneContato)) {
      setMensagem('Telefone de contato inválido. Informe um número válido com DDD.');
      setLoading(false);
      return;
    }

    // Validação dos CEPs
    if (!validarCEP(form.cepTrabalho)) {
      setMensagem('CEP do trabalho inválido. Informe 8 dígitos.');
      setLoading(false);
      return;
    }
    if (!validarCEP(form.cepResidencial)) {
      setMensagem('CEP residencial inválido. Informe 8 dígitos.');
      setLoading(false);
      return;
    }

    const data = new FormData();

    // Crie uma cópia do form para normalizar o CPF
    const formNormalizado = { ...form, cpf: form.cpf.replace(/[^\d]/g, '') };
    if (formNormalizado.valorDesejado) {
      formNormalizado.valorDesejado = Number(formNormalizado.valorDesejado);
    }

    Object.keys(formNormalizado).forEach(key => data.append(key, formNormalizado[key]));
    if (comprovanteRenda) data.append('comprovanteRenda', comprovanteRenda);
    if (comprovanteResidencia) data.append('comprovanteResidencia', comprovanteResidencia);
    if (documentoFotoFrente) data.append('documentoFotoFrente', documentoFotoFrente);
    if (documentoFotoVerso) data.append('documentoFotoVerso', documentoFotoVerso);
    if (fotoSegurandoDocumento) data.append('fotoSegurandoDocumento', fotoSegurandoDocumento);

    const response = await fetch(`${API_URL}/api/cadastro`, {
      method: 'POST',
      body: data,
    });

    setLoading(false);

    if (response.ok) {
      setMensagem('Agora que concluiu o cadastro, retorne ao WhatsApp com seu consultor.');
      setCadastroEnviado(true);
      setForm({
        nome: '',
        indicacao: '',
        cpf: '',
        profissao: '',
        cepTrabalho: '',
        enderecoTrabalho: '',
        numeroTrabalho: '',
        complementoTrabalho: '',
        bairroTrabalho: '',
        telefone: '',
        telefoneContato: '',
        nomeContato: '',
        cepResidencial: '',
        enderecoResidencial: '',
        numeroResidencial: '',
        complementoResidencial: '',
        bairro: '',
        pontoReferencia: '',
        redesSociais: '',
      });
      setComprovanteRenda(null);
      setComprovanteResidencia(null);
      setDocumentoFotoFrente(null);
      setDocumentoFotoVerso(null);
      setFotoSegurandoDocumento(null);
    } else {
      setMensagem('Erro ao enviar cadastro.');
    }
  };

  const calcularTotal = () => {
    const valor = Number(form.valorDesejado);
    if (!valor) return '';
    const total = valor + valor * 0.3;
    return `Valor total a pagar em 30 dias: R$ ${total.toFixed(2).replace('.', ',')}`;
  };

  const handleLogout = () => {
    setAdminLogado(false);
    setTela('formulario');
  };

  console.log(form);

 return (
  <ThemeProvider theme={theme}>
    <Navbar
      onSelect={setTela}
      adminLogado={adminLogado}
      onLogout={handleLogout}
    />
    <Box sx={{ background: "#f5f6fa", minHeight: "100vh", py: 4, mt: { xs: '56px', sm: '64px' } }}>
      <Container maxWidth="md">
        {tela === 'formulario' && (
          <>
            <Typography
              variant="h4"
              sx={{ mb: 4, fontWeight: 'bold', textAlign: 'center' }}
            >
              Formulário de Cadastro
            </Typography>
            {cadastroEnviado ? (
              <Card sx={{ background: '#e3f6e8', border: '1px solid #1976d2', color: '#1976d2', borderRadius: 2, p: 3, m: '40px auto', textAlign: 'center', fontWeight: 'bold', maxWidth: 500, fontSize: 18 }}>
                <CardContent>
                  {mensagem}
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleSubmit}>
                {loading && (
                  <Typography sx={{ textAlign: 'center', color: '#1976d2', fontWeight: 'bold', mb: 2 }}>
                    Enviando cadastro, aguarde...
                  </Typography>
                )}
                {mensagem && (
                  <Card sx={{ background: '#e3f6e8', border: '1px solid #1976d2', color: '#1976d2', borderRadius: 2, p: 2, mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
                    <CardContent>
                      {mensagem}
                    </CardContent>
                  </Card>
                )}

                  {/* DADOS PESSOAIS */}
                  <Card sx={{ mb: 4, maxWidth: 500, mx: "auto" }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Dados Pessoais
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={3}>
                        <TextField
                          label="Nome *"
                          name="nome"
                          value={form.nome}
                          onChange={handleChange}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                        <TextField
                          label="CPF *"
                          name="cpf"
                          value={form.cpf}
                          onChange={handleChange}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                        <TextField
                          label="Indicação"
                          name="indicacao"
                          value={form.indicacao}
                          onChange={handleChange}
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                        <TextField
                          label="Redes Sociais"
                          name="redesSociais"
                          value={form.redesSociais}
                          onChange={handleChange}
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  {/* DADOS PROFISSIONAIS */}
                  <Card sx={{ mb: 4, maxWidth: 500, mx: "auto" }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Dados Profissionais
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={3}>
                        <TextField
                          label="Profissão *"
                          name="profissao"
                          value={form.profissao}
                          onChange={handleChange}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                        <TextField
                          label="CEP (Trabalho) *"
                          name="cepTrabalho"
                          value={form.cepTrabalho}
                          onChange={handleChange}
                          inputProps={{ maxLength: 8 }}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                        <TextField
                          label="Endereço (Trabalho) *"
                          name="enderecoTrabalho"
                          value={form.enderecoTrabalho}
                          onChange={handleChange}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                        <TextField
                          label="Número (Trabalho) *"
                          name="numeroTrabalho"
                          value={form.numeroTrabalho}
                          onChange={handleChange}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                        <TextField
                          label="Bairro (Trabalho) *"
                          name="bairroTrabalho"
                          value={form.bairroTrabalho}
                          onChange={handleChange}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                        <TextField
                          label="Complemento (Trabalho)"
                          name="complementoTrabalho"
                          value={form.complementoTrabalho}
                          onChange={handleChange}
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  {/* DADOS DO EMPRÉSTIMO */}
                  <Card sx={{ mb: 4, maxWidth: 500, mx: "auto" }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Dados do Empréstimo
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={3}>
                        <TextField
                          label="Valor Desejado *"
                          name="valorDesejado"
                          select
                          value={form.valorDesejado}
                          onChange={handleChange}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        >
                          <MenuItem value="">Selecione um valor</MenuItem>
                          {[...Array(7)].map((_, i) => {
                            const valor = (i + 1) * 100;
                            return (
                              <MenuItem key={valor} value={valor}>
                                R$ {valor}
                              </MenuItem>
                            );
                          })}
                        </TextField>
                        <TextField
                          label="Data do Empréstimo *"
                          type="date"
                          name="dataEmprestimo"
                          value={form.dataEmprestimo}
                          onChange={handleChange}
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                          inputProps={{ min: getToday() }}
                          required
                          fullWidth
                        />
                        <TextField
                          label="Data do Pagamento"
                          type="date"
                          name="dataPagamento"
                          value={form.dataPagamento}
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                          InputProps={{ readOnly: true }}
                          disabled
                          required
                          fullWidth
                        />
                        {form.valorDesejado && (
                          <Box sx={{
                            background: '#f0f4fa',
                            border: '1px solid #90caf9',
                            borderRadius: 2,
                            color: '#1565c0',
                            fontWeight: 'bold',
                            fontSize: '1.05rem',
                            p: 2,
                            mt: 1,
                            mb: 1,
                            textAlign: 'center'
                          }}>
                            {calcularTotal()}
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>

                  {/* CONTATOS */}
                  <Card sx={{ mb: 4, maxWidth: 500, mx: "auto" }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Contatos
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={3}>
                        <TextField
                          label="Telefone/WhatsApp *"
                          name="telefone"
                          value={form.telefone}
                          onChange={handleChange}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                        <TextField
                          label="Telefone de algum contato *"
                          name="telefoneContato"
                          value={form.telefoneContato}
                          onChange={handleChange}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                        <TextField
                          label="Nome do contato *"
                          name="nomeContato"
                          value={form.nomeContato}
                          onChange={handleChange}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  {/* ENDEREÇO RESIDENCIAL */}
                  <Card sx={{ mb: 4, maxWidth: 500, mx: "auto" }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Endereço Residencial
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={3}>
                        <TextField
                          label="CEP (Residencial) *"
                          name="cepResidencial"
                          value={form.cepResidencial}
                          onChange={handleChange}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                        <TextField
                          label="Endereço (Residencial) *"
                          name="enderecoResidencial"
                          value={form.enderecoResidencial}
                          onChange={handleChange}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                        <TextField
                          label="Número (Residencial) *"
                          name="numeroResidencial"
                          value={form.numeroResidencial}
                          onChange={handleChange}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                        <TextField
                          label="Bairro *"
                          name="bairro"
                          value={form.bairro}
                          onChange={handleChange}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                        <TextField
                          label="Complemento (Residencial)"
                          name="complementoResidencial"
                          value={form.complementoResidencial}
                          onChange={handleChange}
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                        <TextField
                          label="Ponto de Referência *"
                          name="pontoReferencia"
                          value={form.pontoReferencia}
                          onChange={handleChange}
                          required
                          fullWidth
                          InputLabelProps={{ shrink: true, style: { fontWeight: 'bold' } }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  {/* DOCUMENTOS */}
                  <Card sx={{ mb: 4, maxWidth: 500, mx: "auto" }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Envio de Documentos
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={3}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            sx={{ justifyContent: 'flex-start', fontWeight: 'bold' }}
                          >
                            Documento com Foto - Frente *
                            <input
                              type="file"
                              hidden
                              onChange={e => handleFileChange(e, setDocumentoFotoFrente)}
                            />
                          </Button>
                          <span style={{ fontSize: 13, color: '#1976d2' }}>
                            {documentoFotoFrente ? documentoFotoFrente.name : ''}
                          </span>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            sx={{ justifyContent: 'flex-start', fontWeight: 'bold' }}
                          >
                            Documento com Foto - Verso *
                            <input
                              type="file"
                              hidden
                              onChange={e => handleFileChange(e, setDocumentoFotoVerso)}
                            />
                          </Button>
                          <span style={{ fontSize: 13, color: '#1976d2' }}>
                            {documentoFotoVerso ? documentoFotoVerso.name : ''}
                          </span>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            sx={{ justifyContent: 'flex-start', fontWeight: 'bold' }}
                          >
                            Foto Segurando Documento *
                            <input
                              type="file"
                              hidden
                              onChange={e => handleFileChange(e, setFotoSegurandoDocumento)}
                            />
                          </Button>
                          <span style={{ fontSize: 13, color: '#1976d2' }}>
                            {fotoSegurandoDocumento ? fotoSegurandoDocumento.name : ''}
                          </span>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            sx={{ justifyContent: 'flex-start', fontWeight: 'bold' }}
                          >
                            Comprovante de Residência *
                            <input
                              type="file"
                              hidden
                              onChange={e => handleFileChange(e, setComprovanteResidencia)}
                            />
                          </Button>
                          <span style={{ fontSize: 13, color: '#1976d2' }}>
                            {comprovanteResidencia ? comprovanteResidencia.name : ''}
                          </span>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            sx={{ justifyContent: 'flex-start', fontWeight: 'bold' }}
                          >
                            Comprovante de Renda (Carteira de trabalho, holerite atual ou contra cheque) *
                            <input
                              type="file"
                              hidden
                              onChange={e => handleFileChange(e, setComprovanteRenda)}
                            />
                          </Button>
                          <span style={{ fontSize: 13, color: '#1976d2' }}>
                            {comprovanteRenda ? comprovanteRenda.name : ''}
                          </span>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Button type="submit" variant="contained" color="primary" disabled={loading} size="large">
                      Enviar Cadastro
                    </Button>
                  </Box>
                </form>
              )}
            </>
          )}
          {tela === 'admin' && !adminLogado && (
            <AdminLogin onLogin={() => setAdminLogado(true)} />
          )}
          {tela === 'admin' && adminLogado && (
            <AdminPanel />
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
