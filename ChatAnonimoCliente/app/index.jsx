import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ DICA DE OURO: Se for testar no celular físico, troque 'localhost' pelo IP do seu computador na rede Wi-Fi (ex: 192.168.1.15)
const API_URL = 'https://b2fd-2804-fec-d23a-eb00-8415-ea73-dfe9-7d64.ngrok-free.app'; 

export default function LoginScreen() {
    const [login, setLogin] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!login || !senha) {
            setErro('Preencha todos os campos.');
            return;
        }

        setErro('');
        setCarregando(true);

        try {
            const resposta = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, senha }),
            });

            if (!resposta.ok) {
                const erroData = await resposta.json();
                throw new Error(erroData.erro || 'Erro ao realizar login');
            }

            const data = await resposta.json();
            
            // Salva o token universalmente (Web e Mobile)
            await AsyncStorage.setItem('chat_token', data.token);
            
            // Navega para a tela de chat substituindo a rota atual
            router.replace('/chat'); 

        } catch (error) {
            setErro(error.message);
            if (Platform.OS !== 'web') Alert.alert('Erro', error.message);
        } finally {
            setCarregando(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.box}>
                <Text style={styles.title}>Acesso à Sala</Text>
                
                {erro ? <Text style={styles.erroText}>{erro}</Text> : null}

                <Text style={styles.label}>Usuário</Text>
                <TextInput
                    style={styles.input}
                    value={login}
                    onChangeText={setLogin}
                    placeholder="Digite seu login"
                    autoCapitalize="none"
                />

                <Text style={styles.label}>Senha</Text>
                <TextInput
                    style={styles.input}
                    value={senha}
                    onChangeText={setSenha}
                    placeholder="Digite sua senha"
                    secureTextEntry
                />

                <TouchableOpacity 
                    style={[styles.button, carregando && styles.buttonDisabled]} 
                    onPress={handleLogin}
                    disabled={carregando}
                >
                    {carregando ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>Entrar na Sala</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7f6', padding: 20 },
    box: { width: '100%', maxWidth: 400, backgroundColor: '#fff', padding: 30, borderRadius: 8, borderTopWidth: 6, borderTopColor: '#006994', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 30 },
    label: { fontSize: 14, color: '#555', marginBottom: 8, fontWeight: '600' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 12, marginBottom: 20, fontSize: 16 },
    button: { backgroundColor: '#556b2f', padding: 15, borderRadius: 4, alignItems: 'center', marginTop: 10 },
    buttonDisabled: { backgroundColor: '#9cb07b' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    erroText: { color: '#c62828', backgroundColor: '#ffebee', padding: 10, borderRadius: 4, textAlign: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#ef9a9a' }
});