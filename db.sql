--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: classes; Type: TABLE; Schema: public; Owner: sm52286; Tablespace: 
--

CREATE TABLE classes (
    id integer NOT NULL,
    class_name text NOT NULL
);


ALTER TABLE public.classes OWNER TO sm52286;

--
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: sm52286
--

CREATE SEQUENCE classes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.classes_id_seq OWNER TO sm52286;

--
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sm52286
--

ALTER SEQUENCE classes_id_seq OWNED BY classes.id;


--
-- Name: gravity_data; Type: TABLE; Schema: public; Owner: sm52286; Tablespace: 
--

CREATE TABLE gravity_data (
    user_id integer,
    mission_data text NOT NULL,
    earned_stars integer NOT NULL
);


ALTER TABLE public.gravity_data OWNER TO sm52286;

--
-- Name: instructors; Type: TABLE; Schema: public; Owner: sm52286; Tablespace: 
--

CREATE TABLE instructors (
    user_id integer,
    class_id integer
);


ALTER TABLE public.instructors OWNER TO sm52286;

--
-- Name: users; Type: TABLE; Schema: public; Owner: sm52286; Tablespace: 
--

CREATE TABLE users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    user_type text NOT NULL,
    real_name text NOT NULL,
    email text,
    class_id integer
);


ALTER TABLE public.users OWNER TO sm52286;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: sm52286
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO sm52286;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sm52286
--

ALTER SEQUENCE users_id_seq OWNED BY users.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: sm52286
--

ALTER TABLE ONLY classes ALTER COLUMN id SET DEFAULT nextval('classes_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: sm52286
--

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- Name: classes_pkey; Type: CONSTRAINT; Schema: public; Owner: sm52286; Tablespace: 
--

ALTER TABLE ONLY classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: sm52286; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: game_data_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sm52286
--

ALTER TABLE ONLY gravity_data
    ADD CONSTRAINT game_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- Name: instructors_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sm52286
--

ALTER TABLE ONLY instructors
    ADD CONSTRAINT instructors_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id);


--
-- Name: instructors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sm52286
--

ALTER TABLE ONLY instructors
    ADD CONSTRAINT instructors_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- Name: users_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sm52286
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id);


--
-- Name: public; Type: ACL; Schema: -; Owner: sm52286
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM sm52286;
GRANT ALL ON SCHEMA public TO sm52286;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

