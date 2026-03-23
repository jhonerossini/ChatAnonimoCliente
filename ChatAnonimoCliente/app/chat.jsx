import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Lembre-se do IP da sua rede se for testar no celular
const WS_URL = 'ws://b2fd-2804-fec-d23a-eb00-8415-ea73-dfe9-7d64.ngrok-free.app';

export default function ChatScreen() {
    const [mensagens, setMensagens] = useState([]);
    const [novaMensagem, setNovaMensagem] = useState('');
    const [conectado, setConectado] = useState(false);
    
    const ws = useRef(null);
    const router = useRouter();
    const flatListRef = useRef(null);

    useEffect(() => {
        const iniciarConexao = async () => {
            const token = await AsyncStorage.getItem('chat_token');
            if (!token) {
                router.replace('/');
                return;
            }

            ws.current = new WebSocket(`${WS_URL}/chat/${token}`);

            ws.current.onopen = () => {
                setConectado(true);
                adicionarMensagem('Você entrou na sala.', 'sistema');
            };

            ws.current.onmessage = (event) => {
                adicionarMensagem(event.data, 'recebida');
            };

            ws.current.onclose = () => {
                setConectado(false);
                adicionarMensagem('Conexão encerrada.', 'sistema');
            };
        };

        iniciarConexao();

        return () => {
            if (ws.current) ws.current.close();
        };
    }, []);

    const adicionarMensagem = (texto, tipo) => {
        setMensagens((prev) => [...prev, { id: Date.now().toString() + Math.random(), texto, tipo }]);
    };

    const enviarMensagem = () => {
        if (!novaMensagem.trim() || !conectado) return;
        
        ws.current.send(novaMensagem);
        adicionarMensagem(novaMensagem, 'enviada');
        setNovaMensagem('');
    };

    const deslogar = async () => {
        if (ws.current) ws.current.close();
        await AsyncStorage.removeItem('chat_token');
        router.replace('/');
    };

    const renderMensagem = ({ item }) => (
        <View style={[styles.msgWrapper, styles[`msg_${item.tipo}`]]}>
            <View style={[styles.balao, styles[`balao_${item.tipo}`]]}>
                <Text style={styles[`texto_${item.tipo}`]}>{item.texto}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Cabeçalho */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Sala de Chat {conectado ? '(ON)' : '(OFF)'}</Text>
                    <TouchableOpacity onPress={deslogar} style={styles.btnSair}>
                        <Text style={styles.btnSairText}>Sair</Text>
                    </TouchableOpacity>
                </View>

                {/* Lista de Mensagens */}
                <FlatList
                    ref={flatListRef}
                    data={mensagens}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMensagem}
                    contentContainerStyle={styles.listaMensagens}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={novaMensagem}
                        onChangeText={setNovaMensagem}
                        placeholder="Digite sua mensagem..."
                        editable={conectado}
                        onSubmitEditing={enviarMensagem}
                    />
                    <TouchableOpacity 
                        style={[styles.btnEnviar, (!conectado || !novaMensagem.trim()) && styles.btnEnviarDisabled]} 
                        onPress={enviarMensagem}
                        disabled={!conectado || !novaMensagem.trim()}
                    >
                        <Text style={styles.btnEnviarText}>Enviar</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#006994' }, // Cor de fundo da área segura (notch do iPhone)
    container: { flex: 1, backgroundColor: '#f4f7f6' },
    header: { backgroundColor: '#006994', padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    btnSair: { paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: '#fff', borderRadius: 4 },
    btnSairText: { color: '#fff', fontWeight: 'bold' },
    listaMensagens: { padding: 15, flexGrow: 1, justifyContent: 'flex-end' },
    msgWrapper: { width: '100%', marginBottom: 10, flexDirection: 'row' },
    msg_enviada: { justifyContent: 'flex-end' },
    msg_recebida: { justifyContent: 'flex-start' },
    msg_sistema: { justifyContent: 'center' },
    balao: { maxWidth: '80%', padding: 12, borderRadius: 8 },
    balao_enviada: { backgroundColor: '#556b2f', borderBottomRightRadius: 0 },
    balao_recebida: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderBottomLeftRadius: 0 },
    balao_sistema: { backgroundColor: 'transparent', padding: 0 },
    texto_enviada: { color: '#fff', fontSize: 16 },
    texto_recebida: { color: '#333', fontSize: 16 },
    texto_sistema: { color: '#888', fontStyle: 'italic', fontSize: 12 },
    inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ddd', alignItems: 'center' },
    input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, fontSize: 16, backgroundColor: '#f9f9f9' },
    btnEnviar: { backgroundColor: '#006994', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, marginLeft: 10 },
    btnEnviarDisabled: { backgroundColor: '#99c4d6' },
    btnEnviarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});