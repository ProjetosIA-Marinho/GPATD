import React, { useState, useEffect } from 'react';
import Shell from './components/layout/Shell';
import Dashboard from './components/layout/Dashboard';
import AIChat from './components/ai/AIChat';
import Tasks from './components/tasks/Tasks';
import NewPATD from './components/views/NewPATD';
import Processes from './components/views/Processes';
import Divisions, { Division } from './components/views/Divisions';
import Users from './components/views/Users';
import Reports from './components/views/Reports';
import Documents from './components/views/Documents';
import Efetivo from './components/views/Efetivo';
import { User as UserType } from './components/views/Users';
import { Shield, Bell, User, Files } from 'lucide-react';
import Settings from './components/views/Settings';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import { supabase } from './lib/supabase';
import { checkAndRunScheduledBackup } from './services/backupService';

// Settings component imported from ./components/views/Settings

import { HistoryItem, Process } from './components/views/Processes';

const initialMockProcesses: Process[] = [
  { 
    id: '1', 
    patdNumber: '001/DOA/2024', 
    militar: 'S1 Silva', 
    saram: '6543210', 
    posto: 'S1', 
    especialidade: 'BEI', 
    quadro: 'QADP',
    divisao: 'DOA', 
    setor: 'Seção de Pessoal', 
    dataInicio: '2024-01-10', 
    dataTermino: '2024-01-25',
    dataPunicao: '2024-01-25',
    status: 'Concluído', 
    punicao: 'Repreensão Escrito', 
    diasPunicao: 0,
    boletim: 'BI 12/2024',
    resumoFato: 'O militar em tela deixou de realizar a conferência do material de serviço conforme as normas vigentes da seção, resultando em um atraso na passagem do turno subsequente.',
    apurador: 'Maj Freitas',
    aplicador: 'TC Arantes',
    history: [
      { id: 'h1', date: '2024-01-10', action: 'Abertura', description: 'PATD iniciado por infração disciplinar leve.', user: 'Sgt Ferreira' },
      { id: 'h2', date: '2024-01-15', action: 'Defesa Apresentada', description: 'O militar apresentou justificativas alegando sobrecarga no setor.', user: 'S1 Silva' },
      { id: 'h3', date: '2024-01-20', action: 'Julgamento', description: 'Justificativas não aceitas integralmente.', user: 'Maj Freitas' },
      { id: 'h4', date: '2024-01-25', action: 'Conclusão', description: 'Aplicação de sanção: Repreensão por Escrito.', user: 'TC Arantes' },
    ]
  },
  { 
    id: '2', 
    patdNumber: '002/GLOG/2024', 
    militar: 'S2 Oliveira', 
    saram: '7654321', 
    posto: 'S2', 
    especialidade: 'BMT',
    quadro: 'QADP',
    divisao: 'GLOG-YS', 
    setor: 'Oficina de Motores', 
    dataInicio: '2024-02-15', 
    status: 'Em Andamento', 
    punicao: 'Em Branco', 
    diasPunicao: 0,
    boletim: '',
    resumoFato: 'Indício de irregularidade na prestação de contas de peças sobressalentes da oficina de motores no período de 01 a 10 de fevereiro.',
    apurador: 'Cap Mendonça',
    aplicador: 'Maj Antunes',
    history: [
      { id: 'h1', date: '2024-02-15', action: 'Abertura', description: 'Início da apuração de fatos.', user: 'Ten Costa' },
      { id: 'h2', date: '2024-02-20', action: 'Oitiva', description: 'Ouvido o militar sobre as divergências encontradas.', user: 'Cap Mendonça' },
    ]
  },
  { 
    id: '3', 
    patdNumber: '003/GSD/2024', 
    militar: '3S Costa', 
    saram: '8765432', 
    posto: '3S', 
    especialidade: 'SGS',
    quadro: 'QSS',
    divisao: 'GSD-YS', 
    setor: 'Guarda do Portão', 
    dataInicio: '2024-03-05', 
    dataTermino: '2024-03-15',
    dataPunicao: '2024-03-10',
    status: 'Suspenso', 
    punicao: 'Prisão Sem Svç', 
    diasPunicao: 8,
    boletim: 'BI 45/2024',
    resumoFato: 'Abandono de posto de serviço no portão principal por período superior a 30 minutos sem autorização do oficial de dia.',
    apurador: 'Maj Borges',
    aplicador: 'Cel Rocha',
    history: [
      { id: 'h1', date: '2024-03-05', action: 'Abertura', description: 'Flagrante de abandono de posto.', user: 'Ten Moura' },
      { id: 'h2', date: '2024-03-10', action: 'Suspensão', description: 'Processo suspenso aguardando laudo pericial.', user: 'Maj Borges' },
    ]
  },
  { 
    id: '4', 
    patdNumber: '004/CCAER/2024', 
    militar: 'CD Almeida', 
    saram: '9876543', 
    posto: 'CD', 
    especialidade: 'ALU',
    quadro: 'CFO',
    divisao: 'CCAER', 
    setor: 'Corpo de Alunos', 
    dataInicio: '2024-03-12', 
    status: 'Em Andamento', 
    punicao: 'Em Branco', 
    diasPunicao: 0,
    boletim: '',
    resumoFato: 'Apresentação com uniforme em desalinho reiteradas vezes após advertências verbais.',
    apurador: 'Ten Braga',
    aplicador: 'Cap Nunes',
    history: [
      { id: 'h1', date: '2024-03-12', action: 'Abertura', description: 'Infração disciplinar cometida no pátio de formaturas.', user: 'Ten Braga' },
    ]
  },
];

const initialDivisions: Division[] = [
  { id: '1', name: 'DOA', description: 'Divisão de Operações Aéreas', sectors: ['Seção de Pessoal', 'Seção de Operações', 'Seção de Inteligência'] },
  { id: '2', name: 'GLOG-YS', description: 'Grupo de Logística de Pirassununga', sectors: ['Oficina de Motores', 'Seção de Suprimento', 'Transporte'] },
  { id: '3', name: 'GSD-YS', description: 'Grupo de Segurança e Defesa de Pirassununga', sectors: ['Guarda do Portão', 'Canil', 'Pelotão de Operações Especiais'] },
  { id: '4', name: 'CCAER', description: 'Corpo de Cadetes da Aeronáutica', sectors: ['Corpo de Alunos', 'Seção de Instrução Prática'] },
  { id: '5', name: 'GSAU-YS', description: 'Grupo de Saúde de Pirassununga', sectors: ['Ambulatório', 'Farmácia', 'Fisioterapia'] },
  { id: '6', name: 'CDEF', description: 'Comissão de Desporto de Educação Física', sectors: ['Ginásio', 'Piscina'] },
  { id: '7', name: 'EC', description: 'Esquadrão de Comando', sectors: ['Secretaria', 'Ajudância'] },
];

const initialUsers: UserType[] = [
  { id: '1', name: 'Cap Marinho', posto: 'Cap', saram: '1234567', divisao: 'Comando', role: 'Administrador', status: 'Ativo', lastAccess: '2024-05-15 10:30' },
  { id: '2', name: 'Maj Freitas', posto: 'Maj', saram: '6543210', divisao: 'DOA', role: 'Operador', status: 'Ativo', lastAccess: '2024-05-14 16:45' },
  { id: '3', name: 'Ten Costa', posto: 'Ten', saram: '7654321', divisao: 'GLOG-YS', role: 'Operador', status: 'Ativo', lastAccess: '2024-05-15 08:15' },
  { id: '4', name: 'Sgt Ferreira', posto: 'Sgt', saram: '8765432', divisao: 'DOA', role: 'Operador', status: 'Inativo', lastAccess: '2024-04-20 09:00' },
  { id: '5', name: 'Cel Rocha', posto: 'Cel', saram: '2345678', divisao: 'Comando', role: 'Visualizador', status: 'Ativo', lastAccess: '2024-05-10 14:20' },
];

const mapDbProcess = (p: any): Process => ({
  ...p,
  patdNumber: p.patd_number,
  dataInicio: p.data_inicio,
  dataTermino: p.data_termino,
  dataPunicao: p.data_punicao,
  diasPunicao: p.dias_punicao,
  resumoFato: p.resumo_fato,
  nGrade: p.n_grade,
  observacoes: p.observacoes,
  resumoPunicao: p.resumo_punicao,
  apuradorPosto: p.apurador_posto,
  apuradorQuadro: p.apurador_quadro,
  apuradorSaram: p.apurador_saram,
  aplicadorPosto: p.aplicador_posto,
  aplicadorQuadro: p.aplicador_quadro,
  aplicadorCargo: p.aplicador_cargo,
  oficioNumero: p.oficio_numero,
  protComaer: p.prot_comaer,
  dataOficio: p.data_oficio,
  enquadramentoRdaer: p.enquadramento_rdaer,
  delegacaoDoc: p.delegacao_doc || null,
  sigadSecprom: p.sigad_secprom,
  docArquivado: !!p.doc_arquivado
});

export default function App() {
  const { session, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [processes, setProcesses] = useState<Process[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);

  const fetchData = React.useCallback(async () => {
    if (!session) return;
    try {
      const [divsRes, profilesRes, procRes] = await Promise.all([
        supabase.from('divisions').select('*').order('created_at', { ascending: true }),
        supabase.from('profiles').select('*').order('created_at', { ascending: true }),
        supabase.from('processes').select('*').order('created_at', { ascending: false })
      ]);
      
      if (divsRes.data) setDivisions(divsRes.data);
      if (profilesRes.data) {
        setUsers(profilesRes.data.map(u => ({
          ...u,
          lastAccess: u.last_access ? new Date(u.last_access).toLocaleString() : 'Nunca'
        })));
      }
      if (procRes.data) {
        setProcesses(procRes.data.map(mapDbProcess));
      }
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    fetchData();

    const processChannel = supabase.channel('public:processes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'processes' }, (payload) => {
        if (payload.eventType === 'DELETE' && payload.old) {
          setProcesses(prev => prev.filter(p => p.id !== payload.old.id));
        } else if (payload.eventType === 'INSERT' && payload.new) {
          const newProc = mapDbProcess(payload.new);
          setProcesses(prev => [newProc, ...prev.filter(p => p.id !== newProc.id)]);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const updatedProc = mapDbProcess(payload.new);
          setProcesses(prev => prev.map(p => p.id === updatedProc.id ? { ...p, ...updatedProc } : p));
        }
      })
      .subscribe();

    const handleSystemRestored = () => {
      console.log('[System Restore] Event received, refreshing all data...');
      fetchData();
    };

    window.addEventListener('gpatd_system_restored', handleSystemRestored);

    return () => {
      supabase.removeChannel(processChannel);
      window.removeEventListener('gpatd_system_restored', handleSystemRestored);
    };
  }, [session, fetchData]);
  const [editingProcess, setEditingProcess] = useState<any>(null);
  const [prefilledNewUser, setPrefilledNewUser] = useState<any>(null);
  const [processFilter, setProcessFilter] = useState<string>('');


  
  // Create a dynamic current user based on the authenticated email
  const currentUser = React.useMemo<UserType>(() => {
    const defaultUser: UserType = {
      id: session?.user?.id || 'guest',
      name: 'Guest',
      posto: '',
      saram: '',
      divisao: '',
      role: 'Visualizador',
      status: 'Ativo',
      lastAccess: 'Nunca'
    };
    if (!session?.user?.email) return defaultUser;
    
    // Check if there is a registered user with this email
    const registeredUser = users.find(u => u.email?.toLowerCase() === session.user.email?.toLowerCase() || u.id === session.user.id);
    
    if (registeredUser) {
      return registeredUser;
    }
    
    // Fallback: create name from email if not registered
    const emailParts = session.user.email.split('@')[0];
    const formattedName = emailParts
      .split(/[._-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return {
      ...defaultUser,
      name: formattedName,
      email: session.user.email
    };
  }, [session, users]);

  // Check for auto scheduled backup if admin
  useEffect(() => {
    if (currentUser && currentUser.role === 'Administrador') {
      checkAndRunScheduledBackup(currentUser);
    }
  }, [currentUser]);

  // Redirect Apurador to processes if they land on unauthorized activeTab
  useEffect(() => {
    if (currentUser && currentUser.role === 'Apurador') {
      const allowed = ['processos', 'novo-patd', 'documentos', 'settings'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('processos');
      }
    }
  }, [activeTab, currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  const handleEditProcess = (process: any) => {
    if (currentUser.role === 'Visualizador') return;
    setEditingProcess(process);
    setActiveTab('novo-patd');
  };

  const handleNewPATD = () => {
    if (currentUser.role === 'Visualizador') return;
    setEditingProcess(null);
    setActiveTab('novo-patd');
  };

  const handleSaveProcess = async (newProcessData: any) => {
    // Cancellation
    if (newProcessData === null) {
      setActiveTab('processos');
      return;
    }

    try {
      const dbPayload = {
        patd_number: newProcessData.patdNumber || '000/UNKNOWN/2024',
        militar: newProcessData.nomeCompleto || newProcessData.militar,
        saram: newProcessData.saram,
        posto: newProcessData.posto,
        especialidade: newProcessData.especialidade,
        quadro: newProcessData.quadro,
        divisao: newProcessData.divisao,
        setor: newProcessData.setor,
        data_inicio: newProcessData.dataInicio || new Date().toISOString().split('T')[0],
        data_termino: newProcessData.dataTermino || null,
        data_punicao: newProcessData.dataPunicao || null,
        status: newProcessData.status,
        punicao: newProcessData.punicao,
        dias_punicao: Number(newProcessData.qtdDias) || Number(newProcessData.diasPunicao) || 0,
        boletim: newProcessData.boletim || '',
        resumo_fato: newProcessData.resumoFato,
        apurador: newProcessData.apurador,
        apurador_posto: newProcessData.apuradorPosto || null,
        apurador_quadro: newProcessData.apuradorQuadro || null,
        apurador_saram: newProcessData.apuradorSaram || null,
        aplicador: newProcessData.aplicador,
        aplicador_posto: newProcessData.aplicadorPosto || null,
        aplicador_quadro: newProcessData.aplicadorQuadro || null,
        aplicador_cargo: newProcessData.aplicadorCargo || null,
        oficio_numero: newProcessData.oficioNumero || null,
        prot_comaer: newProcessData.protComaer || null,
        data_oficio: newProcessData.dataOficio || null,
        enquadramento_rdaer: newProcessData.enquadramentoRdaer || null,
        delegacao_doc: newProcessData.delegacaoDoc || null,
        documents: newProcessData.documents || [],
        history: newProcessData.history || [],
        n_grade: newProcessData.nGrade || '',
        observacoes: newProcessData.observacoes || '',
        resumo_punicao: newProcessData.resumoPunicao || '',
        sigad_secprom: newProcessData.sigadSecprom || null,
        doc_arquivado: !!newProcessData.docArquivado
      };

      if (editingProcess && !editingProcess._isPrefilledNew) {
        // Update existing process
        const { error } = await supabase.from('processes').update(dbPayload).eq('id', editingProcess.id);
        if (error) throw error;
        
        setProcesses(prev => prev.map(p => p.id === editingProcess.id ? { 
          ...p, 
          ...newProcessData,
          militar: dbPayload.militar,
          diasPunicao: dbPayload.dias_punicao,
          documents: dbPayload.documents,
          history: dbPayload.history,
          delegacaoDoc: newProcessData.delegacaoDoc || null
        } : p));
      } else {
        // Create new process
        const initialHistory = [
          { 
            field: 'Criação', 
            oldValue: '—', 
            newValue: 'Processo Criado', 
            user: currentUser?.name || 'Sistema', 
            date: new Date().toLocaleString('pt-BR') 
          }
        ];
        
        const insertPayload = {
          ...dbPayload,
          history: initialHistory
        };
        
        const { data, error } = await supabase.from('processes').insert(insertPayload).select().single();
        if (error) throw error;

        // Real email dispatch using Supabase Edge Function
        if (dbPayload.apurador && dbPayload.apurador_saram) {
          try {
            const { data: apuradorProfile } = await supabase
              .from('profiles')
              .select('email, name')
              .eq('saram', dbPayload.apurador_saram)
              .maybeSingle();
            if (apuradorProfile && apuradorProfile.email) {
              const docUrl = dbPayload.documents && dbPayload.documents.length > 0 ? dbPayload.documents[0].url : null;
              const docName = dbPayload.documents && dbPayload.documents.length > 0 ? dbPayload.documents[0].name : null;

              console.log(`[Email Dispatch] Invoking send-notification edge function for ${apuradorProfile.email}`);
              const { data: fnData, error: fnError } = await supabase.functions.invoke('send-notification', {
                body: {
                  to: apuradorProfile.email,
                  name: apuradorProfile.name,
                  patdNumber: dbPayload.patd_number,
                  details: dbPayload.resumo_fato || "",
                  documentUrl: docUrl,
                  documentName: docName,
                  senderPhone: currentUser?.telefone || "",
                  senderExtension: currentUser?.ramal || "",
                  senderEmail: currentUser?.email || ""
                }
              });

              if (fnError) {
                console.warn("[Email Dispatch] Function error (make sure RESEND_API_KEY is configured):", fnError);
                alert(`Processo criado. Observação: Não foi possível enviar a notificação por e-mail para o apurador pois a chave RESEND_API_KEY não está configurada ou houve uma falha no disparo.`);
              } else {
                console.log("[Email Dispatch] Notification sent successfully:", fnData);
              }
            }
          } catch (e) {
            console.error("[Email Dispatch] Unexpected error calling edge function:", e);
          }
        }

        if (data) {
          setProcesses(prev => [{
            ...data,
            patdNumber: data.patd_number,
            dataInicio: data.data_inicio,
            dataTermino: data.data_termino,
            dataPunicao: data.data_punicao,
            diasPunicao: data.dias_punicao,
            resumoFato: data.resumo_fato,
            nGrade: data.n_grade,
            observacoes: data.observacoes,
            resumoPunicao: data.resumo_punicao,
            apuradorPosto: data.apurador_posto,
            apuradorQuadro: data.apurador_quadro,
            apuradorSaram: data.apurador_saram,
            aplicadorPosto: data.aplicador_posto,
            aplicadorQuadro: data.aplicador_quadro,
            aplicadorCargo: data.aplicador_cargo,
            oficioNumero: data.oficio_numero,
            protComaer: data.prot_comaer,
            dataOficio: data.data_oficio,
            enquadramentoRdaer: data.enquadramento_rdaer,
            delegacaoDoc: data.delegacao_doc || null,
            sigadSecprom: data.sigad_secprom,
            docArquivado: !!data.doc_arquivado
          }, ...prev]);
        }
      }

      setActiveTab('processos');
      setEditingProcess(null);
    } catch (err: any) {
      console.error('Error saving process:', err);
      alert(`Erro ao salvar processo: ${err.message || 'Verifique sua conexão com o banco de dados.'}`);
    }
  };

  const handleTabChange = (tab: string, filter?: string) => {
    setActiveTab(tab);
    if (filter) {
      setProcessFilter(filter);
    } else {
      setProcessFilter('');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard processes={processes} setActiveTab={handleTabChange} onSelectProcess={handleEditProcess} globalSearchTerm={searchTerm} currentUser={currentUser} />;
      case 'processos':
        return <Processes processes={processes} setProcesses={setProcesses} divisions={divisions} setActiveTab={handleTabChange} onEdit={handleEditProcess} onNew={handleNewPATD} initialFilter={processFilter} onClearFilter={() => setProcessFilter('')} globalSearchTerm={searchTerm} currentUser={currentUser} />;
      case 'divisoes':
        return <Divisions divisions={divisions} setDivisions={setDivisions} isAdmin={currentUser.role === 'Administrador'} currentUser={currentUser} globalSearchTerm={searchTerm} />;
      case 'usuarios':
        return <Users users={users} setUsers={setUsers} divisions={divisions} globalSearchTerm={searchTerm} isAdmin={currentUser.role === 'Administrador'} loggedUser={currentUser} initialPrefill={prefilledNewUser} onClearPrefill={() => setPrefilledNewUser(null)} />;
      case 'relatorio':
        return <Reports processes={processes} globalSearchTerm={searchTerm} currentUser={currentUser} />;
      case 'chat':
        return <AIChat />;
      case 'tasks':
        return <Tasks />;
      case 'novo-patd':
        return <NewPATD initialData={editingProcess} onSave={handleSaveProcess} divisions={divisions} currentUser={currentUser} processes={processes} />;
      case 'efetivo':
        return <Efetivo currentUser={currentUser} onNewPATDFromEfetivo={(military) => {
          setEditingProcess({
            saram: military.saram,
            militar: military.nome_completo,
            posto: military.posto,
            quadro: military.quadro,
            especialidade: military.especialidade || '',
            divisao: military.divisao || '',
            _isPrefilledNew: true
          });
          setActiveTab('novo-patd');
        }} onNewUserFromEfetivo={(military) => {
          setPrefilledNewUser({
            saram: military.saram,
            name: military.nome_completo,
            posto: military.posto,
            divisao: military.divisao || '',
            email: military.email || '',
            telefone: military.telefone || '',
            ramal: military.ramal || '',
            role: 'Apurador',
            status: 'Ativo'
          });
          setActiveTab('usuarios');
        }} />;
      case 'settings':
        return <Settings currentUser={currentUser} onProfileUpdate={(updated) => setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))} onBackupRestored={fetchData} />;
      case 'documentos':
        return <Documents currentUser={currentUser} />;
      default:
        return <Dashboard processes={processes} setActiveTab={handleTabChange} onSelectProcess={handleEditProcess} globalSearchTerm={searchTerm} currentUser={currentUser} />;
    }
  };

  return (
    <ThemeProvider>
      <Shell 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        processes={processes} 
        onNotificationClick={handleEditProcess}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        currentUser={currentUser}
        divisions={divisions}
      >
        {renderContent()}
      </Shell>
    </ThemeProvider>
  );
}
